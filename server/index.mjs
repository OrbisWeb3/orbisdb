import express from 'express';
import next from 'next';

import IndexingService from "./indexing/index.mjs";
import Supabase from "./db/supabase.mjs";
import HookHandler from "./utils/hookHandler.mjs";
import { loadPlugins, loadAndInitPlugins } from "./utils/plugins.mjs";

/** Load plugins (will need to find a different way to enable those when we migrate to plugins stored in the settings file) */
import HelloWorldPlugin from "./plugins/hello-world/index.mjs"; // Default HelloWorld plugin
import HookModerationExample from "./plugins/moderation-example/index.mjs"; // Example plugin used for moderation
import GitcoinPassportPlugin from "./plugins/gitcoin-passport/index.mjs"; // Gitcoin Passport plugin

/** Initialize the hook handler */
let hookHandler = new HookHandler();

/** Instantiate the plugins to use. Once finalized this will load the plugins saved in the "orbisdb-settings.json" file */
/*let plugins = [
  //new HelloWorldPlugin(),
  //new HookModerationExample(),
  new GitcoinPassportPlugin({ api_key: "G5WwLzpf.HCYtZLKZ9yGq4tOnyLf9OYxejgFXxaSb", scorer_id: "899" })
];*/

/** Instantiate the database to use which should be saved in the "orbisdb-settings.json" file */
let database = new Supabase("url_example", "key_example");

// Create an instance of the application using Next JS pointing to the front-end files located in the client folder
const dev = process.env.NODE_ENV !== 'production';
const app = next({
    dev,
    dir: './client',
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Here you might use various middleware (for cookies, auth, etc.)

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
  // Loads all plugins installed
  let plugins = await loadAndInitPlugins();

  /** Initialize the mainnet indexing service while specifying the plugins to use and database type */
  const MainnetIndexing = new IndexingService(
    "mainnet",  // Ceramic network to subscribe to
    plugins,    // Plugins to use
    database,   // Database instance to use (Supabase was the simplest example since we are currently using it)
    hookHandler // Hookhandler
  );

  /** Subscribe to streams created on Mainnet */
  MainnetIndexing.subscribe();
}

init();
