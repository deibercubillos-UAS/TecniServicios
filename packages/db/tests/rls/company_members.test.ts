import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminClient, anonClient, createTestUser, deleteTestUser, signInAs } from "./helpers";

describe("RLS: company_members", () => {
  const suffix = randomUUID().slice(0, 8);
  const emailOwner = `rls-members-owner-${suffix}@tecni.test`;
  const emailBuyer = `rls-members-buyer-${suffix}@tecni.test`;
  const emailOtherOwner = `rls-members-other-${suffix}@tecni.test`;
  let companyX = "";
  let companyY = "";
  let owner = "";
  let buyer = "";
  let otherOwner = "";

  beforeAll(async () => {
    owner = await createTestUser(emailOwner, "RLS Members Owner", "customer");
    buyer = await createTestUser(emailBuyer, "RLS Members Buyer", "customer");
    otherOwner = await createTestUser(emailOtherOwner, "RLS Members Other Owner", "customer");

    const { data: companies, error } = await adminClient
      .from("companies")
      .insert([
        { legal_name: `Empresa RLS Members X ${suffix}`, document_number: `901${suffix}1` },
        { legal_name: `Empresa RLS Members Y ${suffix}`, document_number: `901${suffix}2` },
      ])
      .select("id");
    if (error || !companies) {
      throw new Error(`No se pudieron crear empresas de prueba: ${error?.message}`);
    }
    const [x, y] = companies;
    if (!x || !y) throw new Error("Insert de empresas de prueba devolvió menos filas de las esperadas");
    companyX = x["id"] as string;
    companyY = y["id"] as string;

    const { error: memberError } = await adminClient.from("company_members").insert([
      { company_id: companyX, profile_id: owner, member_role: "owner" },
      { company_id: companyX, profile_id: buyer, member_role: "buyer" },
      { company_id: companyY, profile_id: otherOwner, member_role: "owner" },
    ]);
    if (memberError) {
      throw new Error(`No se pudieron crear las membresías de prueba: ${memberError.message}`);
    }
  });

  afterAll(async () => {
    await adminClient.from("company_members").delete().in("company_id", [companyX, companyY]);
    await adminClient.from("companies").delete().in("id", [companyX, companyY]);
    await deleteTestUser(owner);
    await deleteTestUser(buyer);
    await deleteTestUser(otherOwner);
  });

  it("un miembro ve su propia membresía y la de sus compañeros de empresa, no las de otra empresa", async () => {
    const client = await signInAs(emailOwner);
    const { data, error } = await client.from("company_members").select("profile_id");
    expect(error).toBeNull();
    const ids = (data ?? []).map((row) => row["profile_id"]).sort();
    expect(ids).toEqual([owner, buyer].sort());
  });

  it("anon no ve ninguna membresía", async () => {
    const client = anonClient();
    const { data, error } = await client.from("company_members").select("profile_id");
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });
});
