import path from 'path';
import express from 'express';
import next from 'next';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

import IndexingService from "./indexing/index.mjs";
import Supabase from "./db/supabase.mjs";
import HelloWorldPlugin from "./plugins/HelloWorld.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Specify the current settings file path which will contain all of the settings of the orbisdb instance */
const settingsFilePath = path.join(__dirname, '../orbisdb-settings.json');

/** Instantiate the plugins to use. Once finalized this will load the plugins saved in the "orbisdb-settings.json" file */
let plugins = [
  new HelloWorldPlugin()
];

/** Instantiate the database to use which should be saved in the "orbisdb-settings.json" file */
let database = new Supabase("url_example", "key_example");

/** Initialize the mainnet indexing service while specifying the plugins to use and database type */
export const MainnetIndexing = new IndexingService(
  "mainnet",  // Ceramic network to subscribe to
  plugins,    // Plugins to use
  database    // Database instance to use (Supabase was the simplest example since we are currently using it)
);


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
  // server.get('/specific-route', (req, res) => { /* handle route */ });

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







/** Subscribe to streams created on Mainnet */
MainnetIndexing.subscribe();
