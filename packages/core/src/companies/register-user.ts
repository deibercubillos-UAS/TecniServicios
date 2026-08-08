import type { SupabaseClient } from "@supabase/supabase-js";

export interface RegisterUserInput {
  fullName: string;
  email: string;
  password: string;
  phone?: string | undefined;
  documentType: string;
  documentNumber: string;
  companyLegalName?: string | undefined;
}

export interface RegisterUserContext {
  ip: string | null;
  policyVersion: string;
}

export interface RegisterUserResult {
  userId: string;
  companyId: string;
  membershipRole: "owner" | "buyer";
}

/**
 * Registra un usuario nuevo y lo asocia a su empresa (docs/06-AUTH-ROLES.md,
 * paso 8.1 de la Fase 1). `authClient` crea la sesión (signUp, bound a
 * cookies); `serviceClient` hace las escrituras que RLS no permite todavía
 * al usuario recién creado (companies no tiene política de insert —
 * intencional, el master es dueño del contenido, ver 01-ARCHITECTURE.md).
 * Nunca recibe la sesión por su cuenta — todo llega por parámetro, para que
 * sea testeable sin Next ni HTTP real (ver docs/01-ARCHITECTURE.md sección 3).
 */
export async function registerUser(
  authClient: SupabaseClient,
  serviceClient: SupabaseClient,
  input: RegisterUserInput,
  ctx: RegisterUserContext,
): Promise<RegisterUserResult> {
  const { data: signUpData, error: signUpError } = await authClient.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { full_name: input.fullName } },
  });
  if (signUpError || !signUpData.user) {
    throw new Error(signUpError?.message ?? "No se pudo crear la cuenta.");
  }
  const userId = signUpData.user.id;

  const { error: consentError } = await serviceClient
    .from("profiles")
    .update({
      phone: input.phone ?? null,
      consent_accepted_at: new Date().toISOString(),
      consent_ip: ctx.ip,
      consent_policy_version: ctx.policyVersion,
    })
    .eq("id", userId);
  if (consentError) {
    throw new Error("No se pudo registrar el consentimiento de tratamiento de datos.");
  }

  const { data: existingCompany, error: lookupError } = await serviceClient
    .from("companies")
    .select("id")
    .eq("document_type", input.documentType)
    .eq("document_number", input.documentNumber)
    .maybeSingle();
  if (lookupError) {
    throw new Error("No se pudo verificar el NIT.");
  }

  let companyId: string;
  let membershipRole: "owner" | "buyer";

  if (existingCompany) {
    companyId = existingCompany["id"] as string;
    membershipRole = "buyer";
  } else {
    if (!input.companyLegalName) {
      throw new Error("Falta la razón social para crear la empresa.");
    }
    const { data: newCompany, error: createError } = await serviceClient
      .from("companies")
      .insert({
        legal_name: input.companyLegalName,
        document_type: input.documentType,
        document_number: input.documentNumber,
      })
      .select("id")
      .single();
    if (createError || !newCompany) {
      throw new Error("No se pudo crear la empresa.");
    }
    companyId = newCompany["id"] as string;
    membershipRole = "owner";
  }

  const { error: memberError } = await serviceClient.from("company_members").insert({
    company_id: companyId,
    profile_id: userId,
    member_role: membershipRole,
    is_primary: membershipRole === "owner",
  });
  if (memberError) {
    throw new Error("No se pudo asociar el usuario a la empresa.");
  }

  return { userId, companyId, membershipRole };
}
