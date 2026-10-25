import Fastify, { LogController } from "fastify";
import {
  DependencyStatusSchema,
  HealthResponseSchema
} from "@icepot/contracts";
import { loadConfig } from "./config.js";
import { createDependencyChecks, type DependencyChecks } from "./dependency-checks.js";

export function buildServer(
  dependencyChecks: DependencyChecks = createDependencyChecks(loadConfig())
) {
  const server = Fastify({
    logController: new LogController({
      disableRequestLogging: true
    }),
    logger: {
      redact: [
        "req.headers.authorization",
        "req.headers.cookie"
      ]
    }
  });

  server.get("/api/health", async () =>
    HealthResponseSchema.parse({
      status: "ok",
      readiness: "ready",
      dependencies: {
        api: "up"
      }
    })
  );

  server.get("/api/dependencies", async () => {
    const names = ["mongodb", "qdrant", "ollama"] as const;
    const results = await Promise.all(
      names.map(async (name) => {
        try {
          await dependencyChecks[name]();
          return [name, "up"] as const;
        } catch {
          return [name, "down"] as const;
        }
      })
    );
    const dependencies = Object.fromEntries(results);

    return DependencyStatusSchema.parse({
      status: results.every(([, state]) => state === "up") ? "ready" : "degraded",
      dependencies
    });
  });

  return server;
}
