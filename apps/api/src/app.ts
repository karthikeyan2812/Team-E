import Fastify, { LogController } from "fastify";
import { HealthResponseSchema } from "@icepot/contracts";

export function buildServer() {
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

  return server;
}
