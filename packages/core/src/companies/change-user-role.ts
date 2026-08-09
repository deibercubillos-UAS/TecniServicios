import type { SupabaseClient } from "@supabase/supabase-js";

import { recordAuditLog } from "../audit/record-audit-log";

export interface ChangeUserRoleContext {
  actorId: string;
  targetUserId: string;
  newRole: "customer" | "seller" | "technician" | "master";
  previousRole: string;
}

/**
 * `profiles_update_self` (05-RLS-SECURITY-A.md) impide que un usuario
 * cambie su propio `role` — el `with check` exige `role = auth_role()`.
 * Por eso el cambio real pasa por `change_user_role()`, una función
 * `security definer` que valida `is_master()` a mano (migración
 * `20260809280000_change_user_role_function.sql`). Corrige la deuda
 * técnica de `registerUser` (nunca auditó) desde el primer uso: todo
 * cambio de rol queda en `audit_log`.
 */
export async function changeUserRole(client: SupabaseClient, serviceClient: SupabaseClient, ctx: ChangeUserRoleContext): Promise<void> {
  const { error } = await client.rpc("change_user_role", { p_user_id: ctx.targetUserId, p_new_role: ctx.newRole });
  if (error) {
    throw new Error("No se pudo cambiar el rol.");
  }

  await recordAuditLog(serviceClient, {
    actorId: ctx.actorId,
    action: "profile.role_changed",
    entity: "profile",
    entityId: ctx.targetUserId,
    before: { role: ctx.previousRole },
    after: { role: ctx.newRole },
  });
}

export interface ChangeMemberRoleInput {
  companyMemberId: string;
  memberRole: "owner" | "buyer" | "accounting" | "workshop";
}

export async function changeCompanyMemberRole(client: SupabaseClient, serviceClient: SupabaseClient, actorId: string, input: ChangeMemberRoleInput): Promise<void> {
  const { data, error } = await client
    .from("company_members")
    .update({ member_role: input.memberRole })
    .eq("id", input.companyMemberId)
    .select("id,profile_id,company_id")
    .single();
  if (error || !data) {
    throw new Error("No se pudo cambiar el rol interno.");
  }

  await recordAuditLog(serviceClient, {
    actorId,
    action: "company_member.role_changed",
    entity: "company_member",
    entityId: input.companyMemberId,
    after: { memberRole: input.memberRole },
  });
}
