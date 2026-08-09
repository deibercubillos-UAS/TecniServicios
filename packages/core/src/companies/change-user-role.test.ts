import { describe, expect, it } from "vitest";

import { changeCompanyMemberRole, changeUserRole } from "./change-user-role";

function fakeRpcClient(error: unknown = null) {
  const calls: { fn: string; args: unknown }[] = [];
  const client = {
    rpc: async (fn: string, args: unknown) => {
      calls.push({ fn, args });
      return { error };
    },
  };
  return { client: client as unknown as Parameters<typeof changeUserRole>[0], calls };
}

function fakeServiceClient(error: unknown = null) {
  const inserted: Record<string, unknown>[] = [];
  const client = {
    from: () => ({
      insert: (payload: Record<string, unknown>) => {
        inserted.push(payload);
        return Promise.resolve({ error });
      },
    }),
  };
  return { client: client as unknown as Parameters<typeof changeUserRole>[1], inserted };
}

describe("changeUserRole", () => {
  it("calls the change_user_role RPC and records an audit entry", async () => {
    const { client, calls } = fakeRpcClient();
    const { client: serviceClient, inserted } = fakeServiceClient();

    await changeUserRole(client, serviceClient, { actorId: "master-1", targetUserId: "user-1", newRole: "seller", previousRole: "customer" });

    expect(calls[0]).toMatchObject({ fn: "change_user_role", args: { p_user_id: "user-1", p_new_role: "seller" } });
    expect(inserted[0]).toMatchObject({ action: "profile.role_changed", entity: "profile", entity_id: "user-1" });
  });

  it("throws when the RPC fails and does not audit", async () => {
    const { client } = fakeRpcClient({ message: "insufficient_privilege" });
    const { client: serviceClient, inserted } = fakeServiceClient();

    await expect(changeUserRole(client, serviceClient, { actorId: "u1", targetUserId: "u2", newRole: "master", previousRole: "customer" })).rejects.toThrow(
      "No se pudo cambiar el rol.",
    );
    expect(inserted).toHaveLength(0);
  });
});

function fakeUpdateClient(row: Record<string, unknown> | null, error: unknown = null) {
  const updated: Record<string, unknown>[] = [];
  const client = {
    from: () => ({
      update: (payload: Record<string, unknown>) => {
        updated.push(payload);
        return {
          eq: () => ({
            select: () => ({
              single: async () => ({ data: row, error }),
            }),
          }),
        };
      },
    }),
  };
  return { client: client as unknown as Parameters<typeof changeCompanyMemberRole>[0], updated };
}

describe("changeCompanyMemberRole", () => {
  it("updates member_role and records an audit entry", async () => {
    const { client, updated } = fakeUpdateClient({ id: "member-1", profile_id: "user-1", company_id: "co-1" });
    const { client: serviceClient, inserted } = fakeServiceClient();

    await changeCompanyMemberRole(client, serviceClient, "master-1", { companyMemberId: "member-1", memberRole: "owner" });

    expect(updated[0]).toMatchObject({ member_role: "owner" });
    expect(inserted[0]).toMatchObject({ action: "company_member.role_changed", entity: "company_member", entity_id: "member-1" });
  });

  it("throws when the update fails and does not audit", async () => {
    const { client } = fakeUpdateClient(null, { message: "boom" });
    const { client: serviceClient, inserted } = fakeServiceClient();

    await expect(changeCompanyMemberRole(client, serviceClient, "master-1", { companyMemberId: "member-1", memberRole: "owner" })).rejects.toThrow(
      "No se pudo cambiar el rol interno.",
    );
    expect(inserted).toHaveLength(0);
  });
});
