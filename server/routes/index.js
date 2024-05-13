import ApiRoutes from "./api/index.js";

export default async function (server, opts) {
  await server.register(ApiRoutes, { prefix: "/api" });

  // Healthcheck endpoint
  // TODO: Deprecate and replace with a prefixed /api/ping
  server.get("/health", async () => "OK");
}
