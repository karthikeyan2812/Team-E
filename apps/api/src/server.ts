import { buildServer } from "./app.js";
import { loadConfig } from "./config.js";
import { createDependencyChecks } from "./dependency-checks.js";

const config = loadConfig();
const server = buildServer(createDependencyChecks(config));

try {
  await server.listen({
    host: "127.0.0.1",
    port: config.API_PORT
  });
} catch (error) {
  server.log.error(error, "Failed to start the local API server.");
  process.exitCode = 1;
}
