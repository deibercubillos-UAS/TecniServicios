import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminClient, anonClient, createTestUser, deleteTestUser, signInAs } from "./helpers";

describe("RLS: companies", () => {
  const suffix = randomUUID().slice(0, 8);
  const emailMember = `rls-company-member-${suffix}@tecni.test`;
  const emailOutsider = `rls-company-outsider-${suffix}@tecni.test`;
  let companyX = "";
  let companyY = "";
  let userMember = "";
  let userOutsider = "";

  beforeAll(async () => {
    userMember = await createTestUser(emailMember, "RLS Company Member", "customer");
    userOutsider = await createTestUser(emailOutsider, "RLS Company Outsider", "customer");

    const { data: companies, error } = await adminClient
      .from("companies")
      .insert([
        { legal_name: `Empresa RLS X ${suffix}`, document_number: `900${suffix}1` },
        { legal_name: `Empresa RLS Y ${suffix}`, document_number: `900${suffix}2` },
      ])
      .select("id");
    if (error || !companies) {
      throw new Error(`No se pudieron crear empresas de prueba: ${error?.message}`);
    }
    const [x, y] = companies;
    if (!x || !y) throw new Error("Insert de empresas de prueba devolvió menos filas de las esperadas");
    companyX = x["id"] as string;
    companyY = y["id"] as string;

    const { error: memberError } = await adminClient
      .from("company_members")
      .insert({ company_id: companyX, profile_id: userMember, member_role: "owner" });
    if (memberError) {
      throw new Error(`No se pudo crear la membresía de prueba: ${memberError.message}`);
    }
  });

  afterAll(async () => {
    await adminClient.from("company_members").delete().in("company_id", [companyX, companyY]);
    await adminClient.from("companies").delete().in("id", [companyX, companyY]);
    await deleteTestUser(userMember);
    await deleteTestUser(userOutsider);
  });

  it("un miembro de la empresa X solo ve X, nunca Y", async () => {
    const client = await signInAs(emailMember);
    const { data, error } = await client.from("companies").select("id");
    expect(error).toBeNull();
    expect((data ?? []).map((row) => row["id"])).toEqual([companyX]);
  });

  it("un usuario sin ninguna empresa asociada no ve nada", async () => {
    const client = await signInAs(emailOutsider);
    const { data, error } = await client.from("companies").select("id");
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  it("anon no ve ninguna empresa", async () => {
    const client = anonClient();
    const { data, error } = await client.from("companies").select("id");
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });
});
