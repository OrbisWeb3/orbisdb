import express from 'express';
import bodyParser from 'body-parser';
import next from 'next';

import IndexingService from "./indexing/index.mjs";
import Postgre from "./db/postgre.mjs";
import HookHandler from "./utils/hookHandler.mjs";
import { loadPlugins } from "./utils/plugins.mjs";

// Create an instance of the application using Next JS pointing to the front-end files located in the client folder
const dev = process.env.NODE_ENV !== 'production';
const app = next({
    dev,
    dir: './client',
});
const handle = app.getRequestHandler();
const server = express();

// Use body parser to parse body field for POST
server.use(bodyParser.json());

app.prepare().then(() => {
  if (!dev) {
    // Serve static files from Next.js production build
    server.use('/_next', express.static(path.join(__dirname, '../client/build')));
    server.use(express.static(path.join(__dirname, '../client/public')));
  }
  
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
  server.post('/api/db/query', async (req, res) => {
    const { query } = req.body;

    try {
      let response = await global.indexingService.database.query(query);
      if (response) {
        res.json({
          status: "200",
          data: response.data?.rows,
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


  // Default catch-all handler to allow Next.js to handle all other routes:
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});

/** Initialize the app by loading all of the required plugins while initializng those and start the indexing service */
async function init() {
  /** Instantiate the database to use which should be saved in the "orbisdb-settings.json" file */
  let database = new Postgre("doadmin", "defaultdb", "AVNS_puV0xIOIp_tdmU1kNEy", "test-orbisdb-do-user-10388596-0.c.db.ondigitalocean.com", 25060);

  /** Initialize the hook handler */
  let hookHandler = new HookHandler();

  /** Initialize the mainnet indexing service while specifying the plugins to use and database type */
  global.indexingService = new IndexingService(
    "mainnet",  // Ceramic network to subscribe to
    database,   // Database instance to use
    hookHandler, // Hookhandler
    server
  );

  /** Subscribe to streams created on Mainnet */
  global.indexingService.subscribe();
}

init();
