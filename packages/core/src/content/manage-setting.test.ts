import { describe, expect, it } from "vitest";

import { updateSetting } from "./manage-setting";

function fakeClient(row: Record<string, unknown> | null, error: unknown = null) {
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
  return { client: client as unknown as Parameters<typeof updateSetting>[0], updated };
}

describe("updateSetting", () => {
  it("updates the value and records who changed it", async () => {
    const { client, updated } = fakeClient({ key: "quote_threshold_cop" });
    const result = await updateSetting(client, "quote_threshold_cop", 6000000, "master-1");
    expect(result.key).toBe("quote_threshold_cop");
    expect(updated[0]).toMatchObject({ value: 6000000, updated_by: "master-1" });
  });

  it("propagates update errors", async () => {
    const { client } = fakeClient(null, { message: "boom" });
    await expect(updateSetting(client, "quote_threshold_cop", 6000000, "master-1")).rejects.toThrow("No se pudo actualizar la configuración.");
  });
});
