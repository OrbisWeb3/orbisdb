import Fastify from "fastify";

import cors from "@fastify/cors";
import fastifySensible from "@fastify/sensible";
import { didAuthMiddleware } from "./middleware/didAuthMiddleware.js";
import fastifyMultipart from "@fastify/multipart";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import { cliColors } from "./utils/cliColors.js";

import { v4 as uuidv4 } from "uuid";

import next from "next";

import IndexingService from "./indexing/index.js";
import Ceramic from "./ceramic/config.js";
import Postgre from "./db/postgre.js";
import HookHandler from "./utils/hookHandler.js";

import { loadPlugins, loadPlugin } from "./utils/plugins.js";
import {
  findContextById,
  findSlotsWithContext,
  getAdminDid,
  getOrbisDBSettings,
  toValidDbName,
  updateContext,
  updateOrAddPlugin,
  updateOrbisDBSettings,
} from "./utils/helpers.js";

import { SelectStatement } from "@useorbis/db-sdk/query";
import fastifyStatic from "@fastify/static";

/** Initialize dirname */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create an instance of the application using Next JS pointing to the front-end files located in the client folder
const dev = process.env.NODE_ENV !== "production";
const nextJs = next({
  dev,
  dir: "./client",
});

// Initialize the main Fastify instance

const server = new Fastify({
  bodyLimit: 50000000,
  ignoreTrailingSlash: true,
});
const PORT = process.env.PORT || 7008;

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../package.json"))
);

async function startServer() {
  await nextJs.prepare();
  const nextRequestHandler = nextJs.getRequestHandler();

  await server.register(cors, {});
  await server.register(fastifyMultipart, {
    limits: {
      fileSize: 50000000,
    },
  });

  // Healthcheck endpoint
  server.get("/health", async () => "OK");

  // Expose some OrbisDB settings through a metadata endpoint
  server.get("/api/metadata", async (req, res) => {
    const orbisdbSettings = getOrbisDBSettings();
    const plugins = await loadPlugins();

    return {
      version: packageJson.version,
      models: orbisdbSettings?.models,
      models_mapping: orbisdbSettings?.models_mapping,
      plugins: plugins.map((plugin) => ({
        id: plugin.id,
        name: plugin.name,
        hooks: plugin.hooks,
      })),
    };
  });

  // authMiddleware

  await server.register(async function (server) {
    await server.addHook("onRequest", didAuthMiddleware);

    // Custom handling of some specific URLs may also go here. For example:
    server.get("/api/plugins/get", async (req, res) => {
      try {
        const plugins = await loadPlugins();
        return {
          plugins,
        };
      } catch (e) {
        return res.internalServerError("Error loading plugins.");
      }
    });

    // Returns API settings
    server.get("/api/settings/get", async (req, res) => {
      const authHeader = req.headers["authorization"];
      const adminDid = await getAdminDid(authHeader);

      console.log("adminDid for /api/settings/get request:", adminDid);

      try {
        const settings = getOrbisDBSettings(adminDid);

        return {
          settings,
        };
      } catch (err) {
        console.error(err);

        return res.internalServerError("Failed to read settings.");
      }
    });
  });

  // Returns instance admin
  server.get("/api/settings/setup-configuration-shared", async (req, res) => {
    const authHeader = req.headers["authorization"];
    const adminDid = await getAdminDid(authHeader);
    console.log(
      "adminDid for /api/settings/setup-configuration-shared request:",
      adminDid
    );

    try {
      // Step 1: Retrieve global configuration to use the global ceramic node and db credentials
      const settings = getOrbisDBSettings();

      // Step 2: Create a new database for this admin did
      let databaseName = toValidDbName(adminDid);
      await global.indexingService.database.createDatabase(databaseName);

      // Step 3: Generate a new seed for the new user of the shared instance
      const buffer = new Uint8Array(32);
      const seed = crypto.getRandomValues(buffer);
      const array = Array.from(seed); // Convert Uint8Array to array
      const _seed = JSON.parse(JSON.stringify(array)); // Convert array to JSON object
      let seedStr = "[" + _seed.toString() + "]";

      // Step 4: Build new credentials configuration in settings for this user
      let ceramicConfiguration = settings.configuration.ceramic;
      ceramicConfiguration.seed = seedStr;

      let dbConfiguration = settings.configuration.db;
      dbConfiguration.database = databaseName;

      let slotSettings = {
        configuration: {
          ceramic: ceramicConfiguration,
          db: dbConfiguration,
        },
      };

      // Apply to global settings
      if (!settings.slots) {
        settings.slots = {}; // Initialize slots as an array if it's not an array already
      }
      settings.slots[adminDid] = slotSettings;

      // Step 5: Update global settings
      updateOrbisDBSettings(settings);

      // Step 6: Restart indexing service
      restartIndexingService(settings);

      // Return results
      return {
        result: "DB created",
        updatedSettings: slotSettings,
      };
    } catch (e) {
      console.log("Error setup shared configuration db:", e);

      return res.internalServerError("Error creating database.");
    }
  });

  // Returns instance admin
  server.get("/api/settings/get-admin/:admin_did", async (req, res) => {
    try {
      const globalSettings = getOrbisDBSettings();
      if (globalSettings.is_shared) {
        return {
          admins: [req.params.admin_did],
        };
      } else {
        return {
          admins: globalSettings?.configuration?.admins,
        };
      }
    } catch (err) {
      console.error(err);
      return res.internalServerError("Failed to read settings.");
    }
  });

  /** Will check if the node has already been configred or not */
  server.get("/api/settings/is-configured", async (req, res) => {
    try {
      const settings = getOrbisDBSettings();

      if (settings) {
        // Map over the slots array to include only the id and title of each slot

        if (settings.is_shared) {
          return {
            is_shared: true,
          };
        } else {
          return {
            is_configured: settings.configuration ? true : false,
            is_shared: false,
          };
        }
      } else {
        return {
          is_configured: false,
          is_shared: false,
        };
      }
    } catch (err) {
      console.error(err);

      return {
        is_shared: false,
        is_configured: false,
      };
    }
  });

  // Adds a new context or update an existing one
  server.post("/api/settings/install-plugin", async (req, res) => {
    const { plugin } = req.body;

    // Retrieve admin
    const authHeader = req.headers["authorization"];
    const adminDid = await getAdminDid(authHeader);

    try {
      // Retrieve settings for this slot
      const settings = getOrbisDBSettings(adminDid);

      // Add the new plugin or update it if already exists
      const updatedSettings = updateOrAddPlugin(settings, plugin);

      console.log("New settings:", updatedSettings);

      // Rewrite the settings file
      updateOrbisDBSettings(updatedSettings, adminDid);

      // Send the response
      return {
        updatedSettings,
        result: "New plugin added to the settings file.",
      };
    } catch (err) {
      console.error(err);

      return res.internalServerError("Failed to update settings.");
    }
  });

  // Adds a new context or update an existing one
  server.post("/api/settings/assign-context", async (req, res) => {
    const { plugin_id, path, variables, uuid } = req.body;

    console.log("Enter assign-context with variables:", variables);

    // Retrieve global settings
    const globalSettings = getOrbisDBSettings();

    // Retrieve admin
    const authHeader = req.headers["authorization"];
    const adminDid = await getAdminDid(authHeader);

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
        console.log("Assigning plugin to a new context.");
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
            console.log("Plugin " + uuid + " updated with:", variables);
          }
        }
      }

      console.log("settings:", settings);

      // Write the updated settings back to the file
      updateOrbisDBSettings(settings, adminDid);

      // Reset plugins
      global.indexingService.resetPlugins();

      // Return results
      return {
        message: "Context updated successfully",
        settings: settings,
      };
    } catch (err) {
      console.error(err);

      return res.internalServerError("Failed to update settings.");
    }
  });

  // Adds a new context or update an existing one
  server.post("/api/settings/add-context", async (req, res) => {
    const { context: _context } = req.body;
    const context = JSON.parse(_context);

    const authHeader = req.headers["authorization"];
    const adminDid = await getAdminDid(authHeader);

    const settings = getOrbisDBSettings(adminDid);

    try {
      // Check if the context is a sub-context or already exists
      if (context.context) {
        // Find the parent context or the existing context
        let parentOrExistingContext = findContextById(
          context.context,
          settings.contexts
        );

        if (parentOrExistingContext) {
          // Check if we're dealing with a parent context or an existing sub-context
          // It's a parent context, add the new sub-context
          if (!parentOrExistingContext.contexts) {
            parentOrExistingContext.contexts = []; // Initialize sub-contexts array if not present
          }
          console.log("parentOrExistingContext:", parentOrExistingContext);
          if (parentOrExistingContext.stream_id === context.context) {
            // It's a sub-context, update it
            console.log("It's a sub-context, update it.");
            parentOrExistingContext.contexts = updateContext(
              parentOrExistingContext.contexts,
              context
            );
          } else {
            // Update or add the sub-context
            parentOrExistingContext.contexts = updateContext(
              parentOrExistingContext.contexts,
              context
            );
          }
        } else {
          throw new Error(`Parent context not found for: ${context.context}`);
        }
      } else {
        // If it's not a sub-context, update or add it to the main contexts array
        settings.contexts = updateContext(settings.contexts, context);
        console.log("Updated contexts with:", settings.contexts);
      }

      console.log("Updated settings:", settings);

      // Rewrite the settings file
      updateOrbisDBSettings(settings, adminDid);

      // Send the response
      return {
        settings,
        context,
        result: "Context updated in the settings file.",
      };
    } catch (err) {
      console.error(err);

      return res.internalServerError("Failed to update settings.");
    }
  });

  // Update settings after configuration setup or update
  server.post("/api/settings/update-configuration", async (req, res) => {
    const { configuration, slot } = req.body;
    console.log("Trying to save:", configuration);

    try {
      // Retrieve current settings
      const settings = getOrbisDBSettings(slot);
      console.log("settings:", settings);

      // Assign new configuration values
      settings.configuration = configuration;

      // Rewrite the settings file
      updateOrbisDBSettings(settings, slot);

      // Restart indexing service
      restartIndexingService();

      // Send the response
      return {
        updatedSettings: settings,
        result: "New configuration saved.",
      };
    } catch (err) {
      console.error(err);

      return res.internalServerError("Failed to update settings.");
    }
  });

  // Update full settings (usually when the JSON settings is paste directly)
  server.post("/api/settings/update-full-settings", async (req, res) => {
    const settings = req.body;
    console.log("Trying to save:", settings);

    try {
      // Retrieve current settings
      /*let settings = getOrbisDBSettings();
      console.log("settings:", settings);

      // Assign new configuration values
      settings = settings;
      */

      // Rewrite the settings file
      updateOrbisDBSettings(settings);

      // Close previous indexing service
      if (global.indexingService) {
        global.indexingService.stop();
      }

      // Start indexing service
      startIndexing();

      // Send the response
      return {
        updatedSettings: settings,
        result: "New configuration saved.",
      };
    } catch (err) {
      console.error(err);

      return res.internalServerError("Failed to update settings.");
    }
  });

  /** Dynamic route to handle GET / POST / PUT / PATCH / DELETE routes exposed by installed plugins */
  server.route({
    method: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    exposesHeadRoute: false,
    url: "/api/plugin-routes/:plugin_uuid/:plugin_route/:plugin_params?",
    handler: async (req, res) => {
      const reqMethod = req.method.toUpperCase();
      const { plugin_uuid, plugin_route } = req.params;

      // Retrieve the plugin installed using uuid
      let plugin = await loadPlugin(plugin_uuid);
      let { ROUTES } = await plugin.init();

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

  // API endpoint to get details of a specific plugin
  await server.register(async function (server) {
    await server.addHook("onRequest", didAuthMiddleware);

    server.get("/api/plugins/:plugin_id", async (req, res) => {
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
        console.error(error);
        return res.internalServerError(
          `Internal server error while loading plugin ${plugin_id}.`
        );
      }
    });

    // Restart the Indexing service
    server.get("/api/restart", async (req, res) => {
      console.log(
        cliColors.text.cyan,
        "⚰️ Restarting indexing service...",
        cliColors.reset
      );

      // Stop the current indexing service
      global.indexingService.stop();

      // Start a new indexing service
      startIndexing();

      // Return results
      return {
        result: "Indexing service restarted.",
      };
    });
  });

  // Ping-pong API endpoint
  server.get("/api/ping", async (req, res) => "pong");

  await server.register(async function (server) {
    await server.addHook("onRequest", didAuthMiddleware);

    // API endpoint to query a table
    server.post("/api/db/query-all", async (req, res) => {
      const { table, page, order_by_indexed_at } = req.body;

      // Retrieve admin
      const authHeader = req.headers["authorization"];
      let adminDid = await getAdminDid(authHeader);

      // Retrieve global settings
      let settings = getOrbisDBSettings();

      // If this is a shared instance we select the right db to query or use the global one
      let database = global.indexingService.databases["global"];
      if (adminDid && settings.is_shared) {
        database = global.indexingService.databases[adminDid];
      }

      try {
        let response = await database.queryGlobal(
          table,
          parseInt(page, 10),
          order_by_indexed_at === "true"
        );
        if (response && response.data) {
          return {
            data: response.data.rows,
            totalCount: response.totalCount,
            title: response.title,
          };
        } else {
          // TODO: Check where used, use appropriate res.notFound
          res.status(404);
          return {
            data: [],
            error: `There wasn't any results returned from table ${table}.`,
          };
        }
      } catch (error) {
        console.error(error);
        return res.internalServerError(
          `Internal server error while querying table ${table}.`
        );
      }
    });
  });

  /** Will build a query from JSON and run it */
  server.post("/api/db/query/json", async (req, res) => {
    const { jsonQuery, env } = req.body;
    const slot = env;

    const { query, params } = SelectStatement.buildQueryFromJson(jsonQuery);

    // Retrieve global settings
    const settings = getOrbisDBSettings();
    console.log("slot:", slot);
    console.log("env:", env);

    // If this is a shared instance we select the right db to query or use the global one
    let database = global.indexingService.databases["global"];
    if (slot && settings.is_shared) {
      database = global.indexingService.databases[slot];
    }

    try {
      const response = await database.query(query, params);
      if (!response) {
        res.status(404);
        return {
          data: [],
          error: `There wasn't any results returned from table.`,
        };
      }

      return {
        data: response.data?.rows,
        totalCount: response.totalCount,
        title: response.title,
      };
    } catch (error) {
      console.error(error);

      res.internalServerError("Internal server error while querying table.");
    }
  });

  await server.register(async function (server) {
    await server.addHook("onRequest", didAuthMiddleware);

    /** Will query the db schema in order to */
    server.get("/api/db/query-schema", async (req, res) => {
      // Retrieve admin
      const authHeader = req.headers["authorization"];
      let adminDid = await getAdminDid(authHeader);

      // Retrieve global settings
      let settings = getOrbisDBSettings();

      // If this is a shared instance we select the right db to query or use the global one
      let database = global.indexingService.databases["global"];
      if (adminDid && settings.is_shared) {
        database = global.indexingService.databases[adminDid];
      }

      // Perform query
      try {
        let response = await database.query_schema();
        if (!response) {
          res.status(404);
          return {
            data: [],
            error: `There wasn't any results returned from table.`,
          };
        }

        return {
          data: response.data?.rows,
          totalCount: response.totalCount,
          title: response.title,
        };
      } catch (error) {
        console.error(error);
        return res.internalServerError(
          `Internal server error while querying table schemas.`
        );
      }
    });

    /** Will run the query wrote by user */
    server.post("/api/db/query", async (req, res) => {
      const { query, params } = req.body;

      // Retrieve admin
      const authHeader = req.headers["authorization"];
      const adminDid = await getAdminDid(authHeader);

      // Retrieve global settings
      const settings = getOrbisDBSettings();

      // If this is a shared instance we select the right db to query or use the global one
      let database = global.indexingService.databases["global"];
      if (adminDid && settings.is_shared) {
        database = global.indexingService.databases[adminDid];
      }

      try {
        const response = await database.query(query, params);
        if (!response) {
          res.status(404);
          return {
            data: [],
            error: `There wasn't any results returned from table.`,
          };
        }

        return {
          data: response.data?.rows ? response.data.rows : [],
          error: response.error,
          totalCount: response.totalCount,
          title: response.title,
        };
      } catch (error) {
        console.error(error);
        return res.internalServerError(
          "Internal server error while querying table."
        );
      }
    });
  });

  /** Will check if a local Ceramic node is running on the same server */
  server.get("/api/local-ceramic-node", async (req, res) => {
    try {
      const local_healtcheck_url =
        "http://localhost:7007/api/v0/node/healthcheck";
      const response = await fetch(local_healtcheck_url);

      return {
        response: await response.text(),
      };
    } catch (e) {
      return res.notFound("There isn't any Ceramic node running locally.");
    }
  });

  if (!dev) {
    // Serve static files from Next.js production build
    console.log("Using production build.");
    server.register(fastifyStatic, {
      prefix: "/public/",
      root: path.join(__dirname, "../client/public"),
    });

    server.register(fastifyStatic, {
      root: path.join(__dirname, "../client/.next"),
      prefix: "/_next/",
      decorateReply: false,
    });
  }

  // Default catch-all handler to allow Next.js to handle all other routes:
  server.route({
    method: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    exposesHeadRoute: false,
    url: "*",
    handler: async (req, res) => {
      return nextRequestHandler(req.raw, res.raw);
    },
  });

  const hostInformation = await server.listen({
    // TODO: make it exposable
    host: "127.0.0.1",
    port: PORT,
  });

  console.log(
    cliColors.text.cyan,
    "📞 OrbisDB UI ready on",
    cliColors.reset,
    hostInformation
  );
}

/** Will stop the previous indexing service and restart a new one */
function restartIndexingService() {
  // Close previous indexing service
  if (global.indexingService) {
    global.indexingService.stop();
  }

  // Start indexing service
  startIndexing();
}

/** Initialize the app by loading all of the required plugins while initializng those and start the indexing service */
export async function startIndexing() {
  // Retrieve OrbisDB current settings
  let settings = getOrbisDBSettings();
  let globalDbConfig = settings?.configuration?.db;
  let globalCeramicConfig = settings?.configuration?.ceramic;
  console.log("In startIndexing:", settings);

  // Initialize some objects
  let ceramics = {};
  let globalCeramic;
  let databases = {};
  let globalDatabase;

  // Initiate global Ceramic
  if (settings?.configuration) {
    let globalSeed = JSON.parse(globalCeramicConfig.seed);
    globalCeramic = new Ceramic(
      globalCeramicConfig.node,
      "http://localhost:" + PORT,
      globalSeed
    );

    /** Instantiate the global database to use which should be saved in the "orbisdb-settings.json" file */
    globalDatabase = new Postgre(
      globalDbConfig.user,
      globalDbConfig.database,
      globalDbConfig.password,
      globalDbConfig.host,
      globalDbConfig.port,
      null
    );
  } else {
    console.log("Couldn't init OrbisDB because configuration isn't setup yet.");
    return;
  }

  if (settings.is_shared) {
    /** Create one postgre and ceramic object per slot */
    if (settings.slots) {
      Object.entries(settings.slots).forEach(([key, slot]) => {
        console.log("Trying to configure indexing for:", key);
        if (slot.configuration) {
          /** Instantiate the database to use for this slot */
          let slotDbConfig = slot.configuration.db;
          let database = new Postgre(
            globalDbConfig.user,
            slotDbConfig.database,
            globalDbConfig.password,
            globalDbConfig.host,
            globalDbConfig.port,
            key
          );

          databases[key] = database;

          /** Instantiate the Ceramic object with node's url from config's slot */
          let seed = JSON.parse(slot.configuration.ceramic.seed);
          let ceramic = new Ceramic(
            globalCeramicConfig.node,
            "http://localhost:" + PORT,
            seed
          );
          ceramics[key] = ceramic;
        } else {
          console.log(
            "Couldn't init IndexingService for " +
              key +
              " because configuration isn't setup yet."
          );
        }
      });
    }
  } else {
    // If configuration settings are valid we start the indexing service
    if (settings?.configuration) {
      databases["global"] = globalDatabase;
      ceramics["global"] = globalCeramic;
    }
  }

  /** Initialize the hook handler */
  let hookHandler = new HookHandler();

  /** Initialize the mainnet indexing service while specifying the plugins to use and database type */
  global.indexingService = new IndexingService(
    globalCeramic, // The global ceramic object will be used to subscribe to SSE
    globalDatabase, // The global database (used for example to create other slot's db)
    ceramics, // The slots individual Ceramic object will be used by plugins installed on the corresponding slot and in the UI
    databases, // Database instance to use
    hookHandler, // Hookhandler
    server,
    settings.is_shared ? settings.is_shared : false
  );

  /** Subscribe to streams created on Mainnet */
  global.indexingService.subscribe();
}

/** Start server */
startServer().catch(console.error);

/** Initialize indexing service */
startIndexing();
