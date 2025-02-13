import { adminDidAuthMiddleware } from "../../../middleware/didAuthMiddleware.js";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import {
  getOrbisDBSettings,
  updateOrAddPlugin,
  updateOrbisDBSettings,
} from "../../../utils/helpers.js";
import {
  installPlugin,
  loadPlugin,
  loadPlugins,
} from "../../../utils/plugins.js";
import { __dirname } from "../../../utils/helpers.js";
import logger from "../../../logger/index.js";

/** prefixed with /api/plugins/ */
export default async function (server, opts) {
  /** List all plugins */
  server.get("/", async (req, res) => {
    try {
      const plugins = await loadPlugins();
      return {
        plugins,
      };
    } catch (e) {
      return res.internalServerError(`Error loading plugins: ${e.message}`);
    }
  });

  server.get("/readme/:pluginId", (req, res) => {
    const pluginId = req.params.pluginId;
    const readmePath = path.join(
      __dirname,
      "../plugins",
      pluginId,
      "README.md"
    );

    fs.readFile(readmePath, "utf8", (err, data) => {
      if (err) {
        if (err.code === "ENOENT") {
          console.log(
            "README file not found for " + pluginId + " / path:" + readmePath
          );
          return res.status(404).send();
        } else {
          return res.status(500).send("Server error");
        }
      }
      res.send(data);
    });
  });

  /** Authenticated scope */
  await server.register(async function (server) {
    await server.addHook("onRequest", adminDidAuthMiddleware);

    /** Will return the details for a specific plugin (not uuid but plugin like "evm-blockchain-listener") */
    server.get("/:plugin_id", async (req, res) => {
      const { plugin_id } = req.params;

      try {
        const plugins = await loadPlugins(); // This loads all available plugins
        const plugin = plugins.find((p) => p.id === plugin_id); // Find the plugin with the corresponding id

        // If no plugin matches the provided id, send an appropriate response
        if (!plugin) {
          return res.notFound(`Plugin with id "${plugin_id}" not found.`);
        }

        return {
          plugin,
        };
      } catch (error) {
        logger.error(error);
        return res.internalServerError(
          `Internal server error while loading plugin ${plugin_id}.`
        );
      }
    });

    /** Will return the dynamic variables for a plugin */
    server.get("/:plugin_uuid/dynamic-variables", async (req, res) => {
      const { plugin_uuid } = req.params;

      try {
        const pluginDetails = await loadPlugin(plugin_uuid);

        // If no plugin matches the provided id, send an appropriate response
        if (!pluginDetails) {
          return res.notFound(
            `Plugin instance with id "${plugin_uuid}" not found.`
          );
        }

        // Retrieve plugin dynamic variables
        if (pluginDetails.getDynamicVariables) {
          let { results: dynamic_variables } =
            await pluginDetails.getDynamicVariables();
          return {
            dynamic_variables,
          };
        } else {
          return [];
        }
      } catch (error) {
        logger.error(error);
        return res.internalServerError(
          `Internal server error while loading plugin ${plugin_uuid}.`
        );
      }
    });

    // Install a plugin
    server.post("/", async (req, res) => {
      const { plugin } = req.body;
      const adminDid = req.adminDid;

      const { updatedSettings, pluginMessage, error } = await installPlugin(
        plugin,
        adminDid
      );

      if (error) {
        return res.internalServerError(error);
      }

      return {
        updatedSettings,
        pluginMessage,
        result: "New plugin added to the settings file.",
      };
    });

    // Assign a plugin to a specified context
    server.post("/:plugin_id/context", async (req, res) => {
      const { plugin_id, path, variables, uuid } = req.body;

      console.log("Enter assign-context with variables:", variables);
      console.log("Enter assign-context with plugin_id:", plugin_id);

      // Retrieve global settings
      const globalSettings = getOrbisDBSettings();

      const adminDid = req.adminDid;

      try {
        const settings = getOrbisDBSettings(adminDid);

        // Find the plugin by plugin_id
        const pluginIndex = settings.plugins?.findIndex(
          (plugin) => plugin.plugin_id === plugin_id
        );

        if (pluginIndex === -1) {
          throw new Error("Plugin not found");
        }

        // Update or add the context
        let contextIndex = -1;
        if (
          settings.plugins &&
          settings.plugins.length > 0 &&
          settings.plugins[pluginIndex]?.contexts
        ) {
          contextIndex = settings.plugins[pluginIndex].contexts.findIndex(
            (c) => c.uuid === uuid
          );
        }

        /** Add a new plugin instance if there wasn't any uuid passed, otherwise update the referenced context */
        if (!uuid) {
          logger.debug("Assigning plugin to a new context.");
          let val = {
            path: path,
            slot: adminDid && globalSettings.is_shared ? adminDid : "global",
            context: path[path.length - 1],
            uuid: uuidv4(), // Assign a unique identifier to this plugin instance on install
          };

          if (variables && Object.keys(variables).length > 0) {
            // Check if variables is not empty
            val.variables = variables;
          }

          // Update settings
          if (settings.plugins) {
            if (settings.plugins[pluginIndex].contexts) {
              settings.plugins[pluginIndex].contexts.push(val);
            } else {
              settings.plugins[pluginIndex].contexts = [val];
            }
          } else {
            settings.plugins = [
              {
                contexts: [val],
              },
            ];
          }
        } else {
          // Update variable for existing plugin instance
          settings.plugins[pluginIndex].contexts[contextIndex].variables =
            variables;

          // TODO: Update runtime variables for this plugin
          let pluginsInstances = await global.indexingService.plugins;
          for (let plugin of pluginsInstances) {
            if (plugin.uuid === uuid) {
              for (let key in variables) {
                plugin[key] = variables[key];
              }
              logger.debug("Plugin " + uuid + " updated with:", variables);
            }
          }
        }

        // Write the updated settings back to the file
        updateOrbisDBSettings(settings, adminDid);

        // Restart plugins
        global.indexingService.restartPlugins(uuid);

        // Return results
        return {
          message: "Context updated successfully",
          settings: settings,
        };
      } catch (err) {
        logger.error(err);

        return res.internalServerError("Failed to update settings.");
      }
    });

    // Delete a plugin from a context
    server.post("/delete", async (req, res) => {
      const { plugin_id, uuid } = req.body;

      logger.debug("Enter /delete plugin with uuid:", uuid);

      // Retrieve global settings
      const globalSettings = getOrbisDBSettings();

      const adminDid = req.adminDid;

      try {
        const settings = getOrbisDBSettings(adminDid);

        // TODO: Find plugin in settings.plugins using the plugin_id and uuid and delete it
        const pluginIndex = settings.plugins.findIndex(
          (plugin) => plugin.plugin_id === plugin_id
        );
        if (pluginIndex !== -1) {
          const contextIndex = settings.plugins[pluginIndex].contexts.findIndex(
            (context) => context.uuid === uuid
          );

          if (contextIndex !== -1) {
            // Remove the context from the plugin
            settings.plugins[pluginIndex].contexts.splice(contextIndex, 1);

            logger.debug("settings:", settings);

            // Write the updated settings back to the file
            updateOrbisDBSettings(settings, adminDid);

            // Reset plugins
            global.indexingService.restartPlugins();

            // Return results
            return {
              message: "Plugin removed successfully",
              settings: settings,
            };
          } else {
            return { message: "Context with given uuid not found" };
          }
        } else {
          return { message: "Plugin with given plugin_id not found" };
        }
      } catch (err) {
        logger.error(err);
        return res.internalServerError(
          "Failed to remove plugin and update settings."
        );
      }
    });
  });

  /** Dynamic route to handle GET / POST / PUT / PATCH / DELETE routes exposed by installed plugins */
  server.route({
    method: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    exposesHeadRoute: false,
    url: "/:plugin_uuid/routes/:plugin_route/:plugin_params?",
    handler: async (req, res) => {
      const reqMethod = req.method.toUpperCase();
      const { plugin_uuid, plugin_route } = req.params;

      // Retrieve the plugin installed using uuid
      const plugin = await loadPlugin(plugin_uuid);
      const { ROUTES } = await plugin.init();

      if (reqMethod in ROUTES) {
        const method = ROUTES[reqMethod][plugin_route];
        if (method) {
          return await method(req, res);
        }
      }

      return res.notFound(
        `Couldn't access route (${reqMethod}:${plugin_route}), make sure that the plugin (${plugin_uuid}) is properly installed and the route is exposed.`
      );
    },
  });
}
