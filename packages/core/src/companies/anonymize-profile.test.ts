import { describe, expect, it } from "vitest";

import { anonymizeProfile } from "./anonymize-profile";

function fakeServiceClient(updateError: unknown = null, insertError: unknown = null) {
  const updated: Record<string, unknown>[] = [];
  const inserted: Record<string, unknown>[] = [];
  const client = {
    from: (table: string) => {
      if (table === "profiles") {
        return {
          update: (payload: Record<string, unknown>) => {
            updated.push(payload);
            return { eq: async () => ({ error: updateError }) };
          },
        };
      }
      return {
        insert: (payload: Record<string, unknown>) => {
          inserted.push(payload);
          return Promise.resolve({ error: insertError });
        },
      };
    },
  };
  return { client: client as unknown as Parameters<typeof anonymizeProfile>[0], updated, inserted };
}

describe("anonymizeProfile", () => {
  it("clears personal fields, deactivates and audits", async () => {
    const { client, updated, inserted } = fakeServiceClient();
    await anonymizeProfile(client, { actorId: "master-1", profileId: "user-1" });

    expect(updated[0]).toMatchObject({ full_name: "Usuario eliminado", phone: null, avatar_url: null, is_active: false });
    expect(inserted[0]).toMatchObject({ action: "profile.anonymized", entity: "profile", entity_id: "user-1" });
  });

  it("throws when the update fails and does not audit", async () => {
    const { client, inserted } = fakeServiceClient({ message: "boom" });
    await expect(anonymizeProfile(client, { actorId: "master-1", profileId: "user-1" })).rejects.toThrow("No se pudo anonimizar el perfil.");
    expect(inserted).toHaveLength(0);
  });

  it("propagates an audit failure", async () => {
    const { client } = fakeServiceClient(null, { message: "boom" });
    await expect(anonymizeProfile(client, { actorId: "master-1", profileId: "user-1" })).rejects.toThrow("No se pudo registrar la auditoría.");
  });
});
