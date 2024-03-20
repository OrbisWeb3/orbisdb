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

import {
  loadAndInitPlugins,
  loadPlugins,
  loadPlugin,
} from "./utils/plugins.mjs";
import { getOrbisDBSettings, updateOrbisDBSettings } from "./utils/helpers.mjs";

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
  let settings = getOrbisDBSettings();
  const authHeader = req.headers['authorization'];

  if(authHeader) {
    const token = authHeader.split(' ')[1]; // Split 'Bearer <token>'
    if(token) {
      try {
        let resAdminSession = await DIDSession.fromSession(token, null);
        let didId = resAdminSession.did.parent;
        const _isAdmin = settings?.configuration?.admins?.includes(didId);
        const _isAdminsEmpty = !settings?.configuration?.admins || settings.configuration.admins.length === 0;
  
        if(didId && (_isAdmin || _isAdminsEmpty)) {
            return next();
        } else {
            return res.json({status: 401, result: "This account isn't an admin."});
        }
      } catch(e) {
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
server.use(bodyParser.json());
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
    try {
      const settings = getOrbisDBSettings();
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
  server.get("/api/settings/get-admin", async (req, res) => {
    try {
      const settings = getOrbisDBSettings();
      res.json({
        status: "200",
        admins: settings?.configuration?.admins,
      });
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

      if(settings && settings.configuration) {
        res.json({
          status: "200",
          result: true
        });
      } else {
        res.json({
          status: "200",
          result: false
        });
      }
      
    } catch (err) {
      console.error(err);
      res.json({
        status: "200",
        result: false
      });
    }
  });

  


  // Custom handling of some specific URLs may also go here. For example:
  server.post("/api/settings/update-configuration", async (req, res) => {
    const { configuration } = req.body;
    console.log("Trying to save:", configuration);

    try {
      // Retrieve current settings
      let settings = getOrbisDBSettings();
      console.log("settings:", settings);

      // Assign new configuration values
      settings.configuration = configuration;

      // Rewrite the settings file
      updateOrbisDBSettings(settings);

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

    // Custom handling of some specific URLs may also go here. For example:
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

      // Retrive all plugins installed
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
  server.post("/api/db/query-all", async (req, res) => {
    const { table, page, order_by_indexed_at } = req.body;
    console.log("order_by_indexed_at:", order_by_indexed_at);

    try {
      let response = await global.indexingService.database.queryGlobal(
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
        res.status(404).json({
          status: "404",
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
    const { jsonQuery } = req.body;

    const { query, params } = SelectStatement.buildQueryFromJson(jsonQuery);

    try {
      let response = await global.indexingService.database.query(query, params);
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
  server.get("/api/db/query-schema", authMiddleware, async (req, res) => {
    try {
      let response = await global.indexingService.database.query_schema();
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

    try {
      let response = await global.indexingService.database.query(query, params);
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

/** Initialize the app by loading all of the required plugins while initializng those and start the indexing service */
export async function startIndexing() {
  // Retrieve OrbisDB current settings
  let settings = getOrbisDBSettings();

  // If configuration settings are valid we start the indexing service
  if (settings?.configuration) {
    /** Instantiate the database to use which should be saved in the "orbisdb-settings.json" file */
    let dbConfig = settings.configuration.db;
    let database = await Postgre.initialize(
      dbConfig.user,
      dbConfig.database,
      dbConfig.password,
      dbConfig.host,
      dbConfig.port);

    /** Instantiate the Ceramic object with node's url from config */
    let seed = JSON.parse(settings.configuration.ceramic.seed);
    let ceramic = new Ceramic(
      settings.configuration.ceramic.node,
      "http://localhost:" + PORT,
      seed
    );

    /** Initialize the hook handler */
    let hookHandler = new HookHandler();

    /** Initialize the mainnet indexing service while specifying the plugins to use and database type */
    global.indexingService = new IndexingService(
      ceramic, // Ceramic class exposing node's url and client
      database, // Database instance to use
      hookHandler, // Hookhandler
      server
    );

    /** Subscribe to streams created on Mainnet */
    global.indexingService.subscribe();
  } else {
    console.log("Couldn't init OrbisDB because configuration isn't setup yet.");
  }
}

/** Start server */
startServer().catch(console.error);

/** Initialize indexing service */
startIndexing();
