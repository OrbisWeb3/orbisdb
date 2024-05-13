import MetadataRoutes from "./metadata/index.js";
import PluginsRoutes from "./plugins/index.js";
import SetupRoutes from "./setup/index.js";
import SettingsRoutes from "./settings/index.js";
import HealthcheckRoutes from "./healthcheck/index.js";
import DbRoutes from "./db/index.js";
import CeramicRoutes from "./ceramic/index.js";
import ContextsRoutes from "./contexts/index.js";
import LogsRoutes from "./logs/index.js";

export default async function (server, opts) {
  await server.register(CeramicRoutes, { prefix: "/ceramic" });
  await server.register(ContextsRoutes, { prefix: "/contexts" });
  await server.register(DbRoutes, { prefix: "/db" });
  await server.register(HealthcheckRoutes, { prefix: "/healthcheck" });
  await server.register(LogsRoutes, { prefix: "/logs" });
  await server.register(MetadataRoutes, { prefix: "/metadata" });
  await server.register(PluginsRoutes, { prefix: "/plugins" });
  await server.register(SettingsRoutes, { prefix: "/settings" });
  await server.register(SetupRoutes, { prefix: "/setup" });
}
