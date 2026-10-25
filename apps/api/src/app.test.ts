import { afterEach, describe, expect, it } from "vitest";
import { buildServer } from "./app.js";

describe("GET /api/health", () => {
  const servers: ReturnType<typeof buildServer>[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => server.close()));
  });

  it("returns the shared readiness contract without configuration details", async () => {
    const server = buildServer();
    servers.push(server);

    const response = await server.inject({
      method: "GET",
      url: "/api/health"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "ok",
      readiness: "ready",
      dependencies: {
        api: "up"
      }
    });
    expect(response.body).not.toContain("API_PORT");
  });

  it("reports local dependency states without leaking connection errors", async () => {
    const server = buildServer({
      mongodb: async () => undefined,
      qdrant: async () => {
        throw new Error("private connection detail");
      },
      ollama: async () => undefined
    });
    servers.push(server);

    const response = await server.inject({
      method: "GET",
      url: "/api/dependencies"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "degraded",
      dependencies: {
        mongodb: "up",
        qdrant: "down",
        ollama: "up"
      }
    });
    expect(response.body).not.toContain("private connection detail");
  });
});
