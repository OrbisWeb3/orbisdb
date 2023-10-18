import path from 'path';
import express from 'express';
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

// Create an instance of the express application
const app = express();

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, '../client/build')));

// Define the port to run the server on
const PORT = 3000;

// Test API endpoint
app.get("/api", (req, res) => {
  res.json({ message: "Hello from server!" });
});

// Load current settings of the app
app.get("/api/settings", (req, res) => {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(300).json({ error: 'Failed to read settings.' });
  }
});

// Update settings of the app (should be protected such as only node admins can update this)
app.get("/api/settings-update", (req, res) => {
  try {
    let newSettings = {
      "new": true
    };
    fs.writeFileSync(settingsFilePath, JSON.stringify(newSettings, null, 2));
    res.json({
      status: 200,
      result: "Settings updated with success"
    });
  } catch (err) {
    console.error(err);
    res.status(300).json({ error: 'Failed to update settings.' });
  }
});

// All other GET requests not handled before will return our React app
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

// Start the server and listen on the defined port
app.listen(PORT, () => {
  console.log(`OrbisDB is running on port ${PORT}`);
});

/** Subscribe to streams created on Mainnet */
MainnetIndexing.subscribe();
