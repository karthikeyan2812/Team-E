import { describe, expect, it, vi } from "vitest";
import {
  MongoStore,
  type MongoClientConnection,
  type MongoDatabase
} from "./mongodb-store.js";

function createMockClient() {
  const adminDatabase: MongoDatabase = {
    command: vi.fn().mockResolvedValue({ ok: 1 })
  };
  const applicationDatabase: MongoDatabase = {
    command: vi.fn().mockResolvedValue({ ok: 1 })
  };
  const client: MongoClientConnection = {
    connect: vi.fn().mockResolvedValue(undefined),
    db: vi.fn((name?: string) => name === "admin" ? adminDatabase : applicationDatabase),
    close: vi.fn().mockResolvedValue(undefined)
  };

  return { client, adminDatabase, applicationDatabase };
}

describe("MongoStore", () => {
  it("connects, pings, selects the configured database, and closes", async () => {
    const { client, adminDatabase, applicationDatabase } = createMockClient();
    const store = await MongoStore.connect(
      "mongodb://127.0.0.1:27017",
      "icepot_qa",
      () => client
    );

    expect(client.connect).toHaveBeenCalledOnce();
    expect(adminDatabase.command).toHaveBeenCalledWith({ ping: 1 });
    await store.ping();
    expect(applicationDatabase.command).toHaveBeenCalledWith({ ping: 1 });
    await store.close();
    expect(client.close).toHaveBeenCalledOnce();
  });

  it("closes the client if initial connectivity verification fails", async () => {
    const { client, adminDatabase } = createMockClient();
    vi.mocked(adminDatabase.command).mockRejectedValueOnce(new Error("connection failed"));

    await expect(
      MongoStore.connect("mongodb://127.0.0.1:27017", "icepot_qa", () => client)
    ).rejects.toThrow("connection failed");
    expect(client.close).toHaveBeenCalledOnce();
  });
});
