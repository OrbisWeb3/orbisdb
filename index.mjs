import express from 'express';
import IndexingService from "./indexing/index.mjs";
import Supabase from "./db/supabase.mjs";
import HelloWorldPlugin from "./plugins/HelloWorld.mjs";

/**
 * Specifying the plugins to use.
 * Q: How to assign those dynamically based on the user selection in its UI?
 */
let plugins = [
  new HelloWorldPlugin()
];

/**
 * Specifyng the database to use.
 * Q: Same question as for plugins, what's the best way to assign the correct one selected in the UI?
 */
let database = new Supabase("url_example", "key_example");

/** Initialize the mainnet indexing service while specifying the plugins to use and database type */
export const MainnetIndexing = new IndexingService(
  "mainnet",  // Ceramic network to subscribe to
  plugins,    // Plugins to use
  database    // Database instance to use (Supabase was the simplest example since we are currently using it)
);

// Create an instance of the express application
const app = express();

// Define the port to run the server on
const PORT = 3000;

// Define a route that sends "Hello, World!" when visited
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Start the server and listen on the defined port
app.listen(PORT, () => {
  console.log(`OrbisDB is running on port ${PORT}`);
});

/** Subscribe to streams created on Mainnet */
MainnetIndexing.subscribe();
