import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { cliColors } from "./utils/cliColors.mjs"

import bodyParser from 'body-parser';
import cors from 'cors';
import next from 'next';

import IndexingService from "./indexing/index.mjs";
import Ceramic from "./ceramic/config.mjs";
import Postgre from "./db/postgre.mjs";
import HookHandler from "./utils/hookHandler.mjs";
import { loadPlugins } from "./utils/plugins.mjs";
import { getOrbisDBSettings, updateOrbisDBSettings } from "./utils/helpers.mjs";

/** Initialize dirname */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create an instance of the application using Next JS pointing to the front-end files located in the client folder
const dev = process.env.NODE_ENV !== 'production';
const app = next({
    dev,
    dir: './client',
});
const handle = app.getRequestHandler();
const server = express();
const PORT = 7008;

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../package.json"))
);

let orbisdbSettings = getOrbisDBSettings();

// Use body parser to parse body field for POST
server.use(bodyParser.json());
server.use(cors());

async function startServer() {
  await app.prepare();

  // Expose some OrbisDB settings through a metadata endpoint
  server.get("/api/metadata", async (req, res) => {
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
  server.get('/api/plugins/get', async (req, res) => {
    try {
      let plugins = await loadPlugins();
      res.json({
        status: "200",
        plugins: plugins
      });
    } catch(e) {
      res.json({
        status: "300",
        result: "Error loading plugins."
      });
    }
  });
  
  // Custom handling of some specific URLs may also go here. For example:
  server.post('/api/settings/update-configuration', async (req, res) => {
    const { configuration } = req.body;
    console.log("Trying to save:", configuration);

    try {
      // Retrieve current settings
      let settings = getOrbisDBSettings();

      // Assign new configuration values
      settings.configuration = configuration;

      // Rewrite the settings file
      updateOrbisDBSettings(settings)

      // Start indexing service
      startIndexing();

      // Send the response
      res.status(200).json({
        status: 200,
        updatedSettings: settings,
        result: "New configuration saved."
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update settings.' });
    }
  });

  // API endpoint to get details of a specific plugin
  server.get('/api/plugins/:plugin_id', async (req, res) => {
    const { plugin_id } = req.params;

    try {
      const plugins = await loadPlugins(); // This loads all available plugins
      const plugin = plugins.find(p => p.id === plugin_id); // Find the plugin with the corresponding id

      if (plugin) {
        res.json({
          status: "200",
          plugin: plugin // Return the found plugin
        });
      } else {
        // If no plugin matches the provided id, send an appropriate response
        res.status(404).json({
          status: "404",
          result: `Plugin with id "${plugin_id}" not found.`
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "500",
        result: "Internal server error while loading plugins."
      });
    }
  });

  // Ping-pong API endpoint
  server.get("/api/ping", async (req, res) => res.send("pong"));

  // API endpoint to query a table
  server.get('/api/db/query-all/:table/:page', async (req, res) => {
    const { table, page } = req.params;

    try {
      let response = await global.indexingService.database.queryGlobal(table, page);
      if (response && response.data) {
        res.json({
          status: "200",
          data: response.data.rows,
          totalCount: response.totalCount,
          title: response.title
        });
      } else {
        res.status(404).json({
          status: "404",
          data: [],
          error: `There wasn't any results returned from table.`
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "500",
        result: "Internal server error while querying table."
      });
    }
  });

  /** Will run the query wrote by user */
  server.post("/api/db/query", async (req, res) => {
    const { query, params } = req.body;

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

  if(!dev) {
    // Serve static files from Next.js production build
    console.log("Using production build.");
    server.use('/_next', express.static(path.join(__dirname, '../client/.next')));
    server.use(express.static(path.join(__dirname, '../client/public')));
  }

  // Default catch-all handler to allow Next.js to handle all other routes:
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(cliColors.text.green, "📞 OrbisDB ready on", cliColors.reset, "http://localhost:" + PORT);
  });
}

/** Initialize the app by loading all of the required plugins while initializng those and start the indexing service */
export async function startIndexing() {
  
  // Retrieve OrbisDB current settings
  let settings = getOrbisDBSettings();
  
  // If configuration settings are valid we start the indexing service
  if(settings?.configuration) {
    /** Instantiate the database to use which should be saved in the "orbisdb-settings.json" file */
    let dbConfig = settings.configuration.db;
    let database = new Postgre(dbConfig.user, dbConfig.database, dbConfig.password, dbConfig.host, dbConfig.port);

    /** Instantiate the Ceramic object with node's url from config */
    let seed = JSON.parse(settings.configuration.ceramic.seed);
    let ceramic = new Ceramic(settings.configuration.ceramic.node, "http://localhost:" + PORT, seed)

    /** Initialize the hook handler */
    let hookHandler = new HookHandler();

    /** Initialize the mainnet indexing service while specifying the plugins to use and database type */
    global.indexingService = new IndexingService(
      ceramic,      // Ceramic class exposing node's url and client
      database,     // Database instance to use
      hookHandler,  // Hookhandler
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
