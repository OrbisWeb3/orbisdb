import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { getOrbisDBSettings } from "../../../utils/helpers.js";
import { loadPlugins } from "../../../utils/plugins.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../../../../package.json"))
);

/** Prefixed with /plugins/metadata */
export default async function (server, opts) {
  server.get("/", async (req, res) => {
    const orbisdbSettings = getOrbisDBSettings();
    const plugins = await loadPlugins();

    return {
      version: packageJson.version,
      models: orbisdbSettings?.models,
      models_mapping: orbisdbSettings?.models_mapping,
      // TODO: Understand shared instance
      plugins: plugins.map((plugin) => ({
        id: plugin.id,
        name: plugin.name,
        hooks: plugin.hooks,
      })),
    };
  });
}
