import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { cliColors } from "./utils/cliColors.mjs";
import { DIDSession } from 'did-session'

import bodyParser from "body-parser";
import cors from "cors";
import next from "next";

import IndexingService from "./indexing/index.mjs";
import Ceramic from "./ceramic/config.mjs";
import Postgre from "./db/postgre.mjs";
import HookHandler from "./utils/hookHandler.mjs";
import { v4 as uuidv4 } from 'uuid';

import {
  loadPlugins,
  loadPlugin,
} from "./utils/plugins.mjs";
import { findContextById, findSlotsWithContext, getAdminDid, getOrbisDBSettings, toValidDbName, updateContext, updateOrAddPlugin, updateOrbisDBSettings } from "./utils/helpers.mjs";
import { SelectStatement } from "@useorbis/db-sdk/query";

/** Initialize dirname */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create an instance of the application using Next JS pointing to the front-end files located in the client folder
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
  dir: "./client",
});

const handle = app.getRequestHandler();
const server = express();
const PORT = process.env.PORT || 7008;

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../package.json"))
);

const authMiddleware = async (req, res, next) => {
  let globalSettings = getOrbisDBSettings();
  const authHeader = req.headers['authorization'];

  if(authHeader) {
    const token = authHeader.split(' ')[1]; // Split 'Bearer <token>'
    console.log("token:", token);
    if(token) {
      try {
        let _isAdmin;
        let _isAdminsEmpty;
        let resAdminSession = await DIDSession.fromSession(token, null);
        let didId = resAdminSession.did.parent;
        console.log("didId extracted from header middleware is:", didId);

        /** Perform different verification logic for shared instances and non-shared ones */
        if(globalSettings.is_shared) {
          // The auth middleware should not be applied for shared instances because users can only modify the slot of the authentication they are using
          _isAdminsEmpty = false;
          _isAdmin = true;
        } else {
          _isAdmin = globalSettings?.configuration?.admins?.includes(didId);
          _isAdminsEmpty = !globalSettings?.configuration?.admins || globalSettings.configuration.admins.length === 0;
        }
  
        if(didId && (_isAdmin || _isAdminsEmpty)) {
            return next();
        } else {
            return res.json({status: 401, result: "This account isn't an admin."});
        }
      } catch(e) {
        console.log("Error checking session JWT:", e);
        return res.json({status: 401, result: "Error checking session JWT with " + token});
      }
      
    } else {
      return res.json({status: 401, result: "You must be connected in order to access this endpoint."});
    }
  } else {
    return res.json({status: 401, result: "You must be connected in order to access this endpoint."});
  }
};

// Use body parser to parse body field for POST and session
server.use(bodyParser.json({limit: '50mb'}));
server.use(bodyParser.urlencoded({limit: '50mb'}));
server.use(cors());

async function startServer() {
  await app.prepare();

  // Healthcheck endpoint
  server.get('/health', (req, res) => res.status(200).send('OK'));

  // Expose some OrbisDB settings through a metadata endpoint
  server.get("/api/metadata", async (req, res) => {
    let orbisdbSettings = getOrbisDBSettings();
    return res.json({
      version: packageJson.version,
      models: orbisdbSettings?.models,
      models_mapping: orbisdbSettings?.models_mapping,
      plugins: (await loadPlugins()).map((plugin) => ({
        id: plugin.id,
        name: plugin.name,
        hooks: plugin.hooks,
      })),
    });
  });

  // Custom handling of some specific URLs may also go here. For example:
  server.get("/api/plugins/get", authMiddleware, async (req, res) => {
    try {
      let plugins = await loadPlugins();
      res.json({
        status: "200",
        plugins: plugins,
      });
    } catch (e) {
      res.json({
        status: "300",
        result: "Error loading plugins.",
      });
    }
  });

  // Returns API settings
  server.get("/api/settings/get", authMiddleware, async (req, res) => {
    const authHeader = req.headers['authorization'];
    let adminDid = await getAdminDid(authHeader);
    console.log("adminDid for /api/settings/get request:", adminDid);
    try {
      const settings = getOrbisDBSettings(adminDid);
      res.json({
        status: "200",
        settings: settings,
      });
    } catch (err) {
      console.error(err);
      res.json({
        status: "500",
        error: 'Failed to read settings.'
      });
    }
  });

  // Returns instance admin
  server.get("/api/settings/setup-configuration-shared", async (req, res) => {
    const authHeader = req.headers['authorization'];
    let adminDid = await getAdminDid(authHeader);
    console.log("adminDid for /api/settings/setup-configuration-shared request:", adminDid);

    try {
      // Step 1: Retrieve global configuration to use the global ceramic node and db credentials
      let settings = getOrbisDBSettings();
          
      // Step 2: Create a new database for this admin did
      let databaseName = toValidDbName(adminDid);
      await global.indexingService.database.createDatabase(databaseName);

      // Step 3/ Generate a new seed
      const buffer = new Uint8Array(32);
      const seed = crypto.getRandomValues(buffer);
      const array = Array.from(seed); // Convert Uint8Array to array
      const _seed = JSON.parse(JSON.stringify(array)); // Convert array to JSON object
      let seedStr = "[" + _seed.toString() + "]";
      console.log("seedStr:", seedStr)

      // Step 4: Build new credentials configuration in settings for this user
      let ceramicConfiguration = settings.configuration.ceramic;
      ceramicConfiguration.seed = seedStr;

      let dbConfiguration = settings.configuration.db;
      dbConfiguration.database = databaseName;

      let slotSettings = {
        configuration: {
          ceramic: ceramicConfiguration,
          db: dbConfiguration
        }
      }

      // Apply to global settings
      if (!settings.slots) {
        settings.slots = {}; // Initialize slots as an array if it's not an array already
      }
      settings.slots[adminDid] = slotSettings;
      console.log("Trying to save settings:", settings);

      // Step 5: Update global settings
      updateOrbisDBSettings(settings);

      // Step 6: Restart indexing service
      restartIndexingService(settings);

      // Return results
      res.json({
        status: "200",
        result: "DB created",
        updatedSettings: slotSettings
      });
    } catch(e) {
      console.log("Error setup shared configuration db:", e);
      res.json({
        status: "300",
        result: "Error creating database.",
      });
    }
  });

  // Returns instance admin
  server.get("/api/settings/get-admin/:admin_did", async (req, res) => {
    try {
      const globalSettings = getOrbisDBSettings();
      if(globalSettings.is_shared) {
        res.json({
          status: "200",
          admins: [req.params.admin_did],
        });
      } else {
        res.json({
          status: "200",
          admins: globalSettings?.configuration?.admins,
        });
      }
    } catch (err) {
      console.error(err);
      res.json({
        status: "500",
        error: 'Failed to read settings.'
      });
    }
  });

  /** Will check if the node has already been configred or not */
  server.get("/api/settings/is-configured", async (req, res) => {
    try {
      const settings = getOrbisDBSettings();
  
      if(settings) {
        // Map over the slots array to include only the id and title of each slot

        if(settings.is_shared) {
          res.json({
            status: "200",
            is_shared: true
          });
        } else {
          res.json({
            status: "200",
            is_configured: settings.configuration ? true : false,
            is_shared: false
          });
        }
      } else {
        res.json({
          status: "200",
          is_configured: false,
          is_shared: false
        });
      }
    } catch (err) {
      console.error(err);
      res.json({
        status: "200",
        is_shared: false,
        is_configured: false
      });
    }
  });

  // Adds a new context or update an existing one
  server.post("/api/settings/install-plugin", async (req, res) => {
    const { plugin } = req.body;

    // Retrieve admin
    const authHeader = req.headers['authorization'];
    let adminDid = await getAdminDid(authHeader);

    try {
      // Retrieve settings for this slot
      let settings = getOrbisDBSettings(adminDid);

      // Add the new plugin or update it if already exists
      const updatedSettings = updateOrAddPlugin(settings, plugin);

      console.log("New settings:", updatedSettings);

      // Rewrite the settings file
      await updateOrbisDBSettings(updatedSettings, adminDid);

      // Send the response
      res.status(200).json({
        status: 200,
        updatedSettings,
        result: "New plugin added to the settings file."
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update settings.' });
    }
  }); 

  // Adds a new context or update an existing one
  server.post("/api/settings/assign-context", async (req, res) => {
    const { plugin_id, path, variables, uuid } = req.body;

    console.log("Enter assign-context with variables:", variables);

    // Retrieve global settings
    let globalSettings = getOrbisDBSettings();

    // Retrieve admin
    const authHeader = req.headers['authorization'];
    let adminDid = await getAdminDid(authHeader);

    try {
      let settings = getOrbisDBSettings(adminDid);

      // Find the plugin by plugin_id
      const pluginIndex = settings.plugins?.findIndex(plugin => plugin.plugin_id === plugin_id);
      if (pluginIndex === -1) {
        throw new Error('Plugin not found');
      }

      // Update or add the context
      let contextIndex = -1;
      if(settings.plugins && settings.plugins.length > 0 && settings.plugins[pluginIndex]?.contexts) {
        contextIndex = settings.plugins[pluginIndex].contexts.findIndex(c => c.uuid === uuid);
      }

      /** Add a new plugin instance if there wasn't any uuid passed, otherwise update the referenced context */
      if (!uuid) {
        console.log("Assigning plugin to a new context.");
        let val = {
          path: path,
          slot: (adminDid && globalSettings.is_shared) ? adminDid : "global",
          context: path[path.length - 1],
          uuid: uuidv4() // Assign a unique identifier to this plugin instance on install
        };

        if (variables && Object.keys(variables).length > 0) { // Check if variables is not empty
          val.variables = variables;
        }

        // Update settings
        if(settings.plugins) {
          if(settings.plugins[pluginIndex].contexts) {
            settings.plugins[pluginIndex].contexts.push(val);
          } else {
            settings.plugins[pluginIndex].contexts = [val];
          }
        } else {
          settings.plugins = [{
            contexts: [val]
          }];
        }

      } else {
        // Update variable for existing plugin instance
        settings.plugins[pluginIndex].contexts[contextIndex].variables = variables;

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

      console.log("settings:", settings)

      // Write the updated settings back to the file
      await updateOrbisDBSettings(settings, adminDid);

      // Reset plugins
      global.indexingService.resetPlugins();

      // Return results
      res.status(200).json({ message: 'Context updated successfully', settings: settings });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update settings.' });
    }
  }); 


  // Adds a new context or update an existing one
  server.post("/api/settings/add-context", async (req, res) => {
    const { context: _context } = req.body;
    let context = JSON.parse(_context);

    const authHeader = req.headers['authorization'];
    let adminDid = await getAdminDid(authHeader);

    let settings = getOrbisDBSettings(adminDid);

    try {
      // Check if the context is a sub-context or already exists
      if (context.context) {
        // Find the parent context or the existing context
        let parentOrExistingContext = findContextById(context.context, settings.contexts);

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
            parentOrExistingContext.contexts = updateContext(parentOrExistingContext.contexts, context);
          } else {
            // Update or add the sub-context
            parentOrExistingContext.contexts = updateContext(parentOrExistingContext.contexts, context);
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
      await updateOrbisDBSettings(settings, adminDid);

      // Send the response
      res.status(200).json({
        status: 200,
        settings,
        context,
        result: "Context updated in the settings file."
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update settings.' });
    }
  });

  // Update settings after configuration setup or update
  server.post("/api/settings/update-configuration", async (req, res) => {
    const { configuration, slot } = req.body;
    console.log("Trying to save:", configuration);

    try {
      // Retrieve current settings
      let settings = getOrbisDBSettings(slot);
      console.log("settings:", settings);

      // Assign new configuration values
      settings.configuration = configuration;

      // Rewrite the settings file
      await updateOrbisDBSettings(settings, slot);

      // Restart indexing service
      restartIndexingService();

      // Send the response
      res.status(200).json({
        status: 200,
        updatedSettings: settings,
        result: "New configuration saved.",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update settings." });
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
      await updateOrbisDBSettings(settings);

      // Close previous indexing service
      if(global.indexingService) {
        global.indexingService.stop();
      }

      // Start indexing service
      startIndexing();

      // Send the response
      res.status(200).json({
        status: 200,
        updatedSettings: settings,
        result: "New configuration saved.",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update settings." });
    }
  });

  /** Dynamic route to handle GET routes exposed by installed plugins */
  server.get(
    "/api/plugin-routes/:plugin_uuid/:plugin_route/:plugin_params?",
    async (req, res) => {
      const { plugin_uuid, plugin_route } = req.params;
      let method;

      // Retrieve the plugin installed using uuid
      let plugin = await loadPlugin(plugin_uuid);
      let { ROUTES } = await plugin.init();
      method = ROUTES?.GET[plugin_route];

      if (method) {
        await method(req, res);
      } else {
        res.status(200).json({
          status: 200,
          plugin_uuid,
          plugin_route,
          result:
            "Couldn't access this route, make sure that this plugin is properly installed.",
        });
      }
    }
  );

  /** Dynamic route to handle GET routes exposed by installed plugins */
  server.post(
    "/api/plugin-routes/:plugin_uuid/:plugin_route",
    async (req, res) => {
      const { plugin_uuid, plugin_route } = req.params;
      console.log(
        "Trying to load method for plugin: " +
          plugin_uuid +
          " and route:" +
          plugin_route
      );
      let method;

      // Retrive all plugins installed
      let plugin = await loadPlugin(plugin_uuid);
      let { ROUTES } = await plugin.init();
      console.log("ROUTES:", ROUTES);
      method = ROUTES?.POST[plugin_route];
      console.log("method:", method);

      if (method) {
        await method(req, res);
      } else {
        res.status(200).json({
          status: 200,
          plugin_uuid,
          plugin_route,
          result:
            "Couldn't access this route, make sure that this plugin is properly installed.",
        });
      }
    }
  );

  // API endpoint to get details of a specific plugin
  server.get("/api/plugins/:plugin_id", authMiddleware, async (req, res) => {
    const { plugin_id } = req.params;

    try {
      const plugins = await loadPlugins(); // This loads all available plugins
      const plugin = plugins.find((p) => p.id === plugin_id); // Find the plugin with the corresponding id

      if (plugin) {
        res.json({
          status: "200",
          plugin: plugin, // Return the found plugin
        });
      } else {
        // If no plugin matches the provided id, send an appropriate response
        res.status(404).json({
          status: "404",
          result: `Plugin with id "${plugin_id}" not found.`,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "500",
        result: "Internal server error while loading plugins.",
      });
    }
  });

  // Restart the Indexing service
  server.get("/api/restart", authMiddleware, async (req, res) => {
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
    res.json({
      status: "200",
      result: "Indexing service restarted.",
    });
  });

  // Ping-pong API endpoint
  server.get("/api/ping", async (req, res) => res.send("pong"));

  // API endpoint to query a table
  server.post("/api/db/query-all", authMiddleware, async (req, res) => {
    const { table, page, order_by_indexed_at } = req.body;
    
    // Retrieve admin
    const authHeader = req.headers['authorization'];
    let adminDid = await getAdminDid(authHeader);

    // Retrieve global settings
    let settings = getOrbisDBSettings();

    // If this is a shared instance we select the right db to query or use the global one
    let database = global.indexingService.databases["global"];
    if(adminDid && settings.is_shared) {
      database = global.indexingService.databases[adminDid];
    }

    try {
      let response = await database.queryGlobal(
        table,
        parseInt(page, 10),
        order_by_indexed_at === 'true'
      );
      if (response && response.data) {
        res.json({
          status: "200",
          data: response.data.rows,
          totalCount: response.totalCount,
          title: response.title,
        });
      } else {
        res.status(200).json({
          status: "200",
          data: [],
          error: `There wasn't any results returned from table ${table}.`,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "500",
        error: "Internal server error while querying table.",
      });
    }
  });


  /** Will build a query from JSON and run it */
  server.post("/api/db/query/json", async (req, res) => {
    const { jsonQuery, env } = req.body;
    let slot = env;

    const { query, params } = SelectStatement.buildQueryFromJson(jsonQuery);
    
    // Retrieve global settings
    let settings = getOrbisDBSettings();
    console.log("slot:", slot);
    console.log("env:", env);

    // If this is a shared instance we select the right db to query or use the global one
    let database = global.indexingService.databases["global"];
    if(slot && settings.is_shared) {
      database = global.indexingService.databases[slot];
    }

    try {
      let response = await database.query(query, params);
      if (response) {
        res.json({
          status: "200",
          data: response.data?.rows,
          totalCount: response.totalCount,
          title: response.title,
        });
      } else {
        res.status(404).json({
          status: "404",
          data: [],
          error: `There wasn't any results returned from table.`,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "500",
        result: "Internal server error while querying table.",
      });
    }
  });

  /** Will query the db schema in order to */
  server.get("/api/db/query-schema", authMiddleware, async (req, res) => {
    // Retrieve admin
    const authHeader = req.headers['authorization'];
    let adminDid = await getAdminDid(authHeader);

    // Retrieve global settings
    let settings = getOrbisDBSettings();

    // If this is a shared instance we select the right db to query or use the global one
    let database = global.indexingService.databases["global"];
    if(adminDid && settings.is_shared) {
      database = global.indexingService.databases[adminDid];
    }

    // Perform query
    try {
      let response = await database.query_schema();
      if (response) {
        res.json({
          status: "200",
          data: response.data?.rows,
          totalCount: response.totalCount,
          title: response.title,
        });
      } else {
        res.status(404).json({
          status: "404",
          data: [],
          error: `There wasn't any results returned from table.`,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "500",
        result: "Internal server error while querying table.",
      });
    }
  });

  /** Will run the query wrote by user */
  server.post("/api/db/query", authMiddleware, async (req, res) => {
    const { query, params } = req.body;

    // Retrieve admin
    const authHeader = req.headers['authorization'];
    let adminDid = await getAdminDid(authHeader);

    // Retrieve global settings
    let settings = getOrbisDBSettings();

    // If this is a shared instance we select the right db to query or use the global one
    let database = global.indexingService.databases["global"];
    if(adminDid && settings.is_shared) {
      database = global.indexingService.databases[adminDid];
    }

    try {
      let response = await database.query(query, params);
      if (response) {
        res.json({
          status: "200",
          data: response.data?.rows ? response.data.rows : [],
          error: response.error,
          totalCount: response.totalCount,
          title: response.title,
        });
      } else {
        res.status(404).json({
          status: "404",
          data: [],
          error: `There wasn't any results returned from table.`,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "500",
        result: "Internal server error while querying table.",
      });
    }
  });

  /** Will check if a local Ceramic node is running on the same server */
  server.get("/api/local-ceramic-node", async (req, res) => {
    try {
      let healtcheck_url = 'http://localhost:7007/api/v0/node/healthcheck';
      let response = await fetch(healtcheck_url);
      let resNode = await response.text();

      res.json({
        status: "200",
        res: resNode
      });
    } catch(e) {
      res.status(500).json({
        status: "500",
        result: "There isn't any Ceramic node running locally.",
      });
    }
    
  });  

  if (!dev) {
    // Serve static files from Next.js production build
    console.log("Using production build.");
    server.use(
      "/_next",
      express.static(path.join(__dirname, "../client/.next"))
    );
    server.use(express.static(path.join(__dirname, "../client/public")));
  }
  
  // Default catch-all handler to allow Next.js to handle all other routes:
  server.all("*", (req, res) => {
    return handle(req, res); // Continue with Next.js handling if authenticated or if it's the '/auth' path
  });

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(
      cliColors.text.cyan,
      "📞 OrbisDB UI ready on",
      cliColors.reset,
      "http://localhost:" + PORT
    );
  });
}

/** Will stop the previous indexing service and restart a new one */
function restartIndexingService() {
  // Close previous indexing service
  if(global.indexingService) {
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
  let databases = {};

  // Initiate global Ceramic
  let globalSeed = JSON.parse(globalCeramicConfig.seed);
  let globalCeramic = new Ceramic(
    globalCeramicConfig.node,
    "http://localhost:" + PORT,
    globalSeed
  );

  /** Instantiate the global database to use which should be saved in the "orbisdb-settings.json" file */
  let globalDatabase = new Postgre(
    globalDbConfig.user,
    globalDbConfig.database,
    globalDbConfig.password,
    globalDbConfig.host,
    globalDbConfig.port,
    null);

  if(settings.is_shared) {
    /** Create one postgre and ceramic object per slot */
    if(settings.slots) {
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
            key);
    
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
          console.log("Couldn't init IndexingService for " + key + " because configuration isn't setup yet.");
        }
      });
    }
  } else {
    // If configuration settings are valid we start the indexing service
    if (settings?.configuration) {
      databases["global"] = globalDatabase;
      ceramics["global"] = globalCeramic;
    } else {
      console.log("Couldn't init OrbisDB because configuration isn't setup yet.");
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
