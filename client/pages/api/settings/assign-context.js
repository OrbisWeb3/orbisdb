// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import fs from 'fs';
import path from 'path';
import { findContextById } from "../../../utils";

// The path to your settings file might need to be adjusted based on your project's structure
const settingsFilePath = path.resolve(process.cwd(), 'orbisdb-settings.json');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { plugin_id, path } = req.body;
    console.log("plugin_id:", plugin_id);
    console.log("path:", path);

    try {
      // Ensure the settings file exists or the readFileSync method will throw an error
      if (!fs.existsSync(settingsFilePath)) {
        throw new Error('Settings file does not exist');
      }

      let settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));

      // 01. Find plugin in array using the plugin id field
      let plugin = findPlugin(settings.plugins, plugin_id);
      console.log("plugin retrieved:", plugin);

      // 02. Create or update contexts object
      let assigned_context = {
        path: path,
        context: path[path.length - 1]
      }

      // 03. Update object to assign new context to installed plugin
      let plugin_contexts;
      if(!plugin.contexts) {
        plugin_contexts = [assigned_context];
      } else {
        plugin_contexts = [...plugin.contexts, assigned_context];
      }
      plugin.contexts = plugin_contexts;

      console.log("New settings:", settings);

      // Rewrite the settings file
      fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));

      // Send the response
      res.status(200).json({
        status: 200,
        settings,
        result: "Model added to the settings file."
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update settings.' });
    }
  } else {
    // If it's not a POST request, return 405 - Method Not Allowed
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  }
}

function findPlugin(plugins, plugin_id) {
    return plugins.find(plugin => plugin.plugin_id === plugin_id);
}
