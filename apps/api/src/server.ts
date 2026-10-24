import { buildServer } from "./app.js";

const server = buildServer();
const parsedPort = Number(process.env.API_PORT ?? "3001");

if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
  throw new Error("API_PORT must be an integer between 1 and 65535.");
}

try {
  await server.listen({
    host: "127.0.0.1",
    port: parsedPort
  });
} catch (error) {
  server.log.error(error, "Failed to start the local API server.");
  process.exitCode = 1;
}

