import ApiRoutes from "./api/index.js";
import GraphQLRoute from "./graphql/index.js";

export default async function (server, opts) {
  await server.register(ApiRoutes, { prefix: "/api" });

  await server.register(GraphQLRoute);

  // Healthcheck endpoint
  // TODO: Deprecate and replace with a prefixed /api/ping
  server.get("/health", async () => "OK");
}
