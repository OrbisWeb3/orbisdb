// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import fs from 'fs';
import path from 'path';
import { findContextById } from "../../../utils";

// The path to your settings file might need to be adjusted based on your project's structure
const settingsFilePath = path.resolve(process.cwd(), 'orbisdb-settings.json');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { plugin_id, path, variables, context_id } = req.body;
    console.log("plugin_id:", plugin_id);
    console.log("path:", path);

    try {
      // Ensure the settings file exists or the readFileSync method will throw an error
      if (!fs.existsSync(settingsFilePath)) {
        throw new Error('Settings file does not exist');
      }

      let settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));


      // Find the plugin by plugin_id
      const pluginIndex = settings.plugins.findIndex(plugin => plugin.plugin_id === plugin_id);
      if (pluginIndex === -1) {
        throw new Error('Plugin not found');
      }

      // Update or add the context
      const contextIndex = settings.plugins[pluginIndex].contexts.findIndex(c => c.context === context_id);
      if (contextIndex === -1) {
        let val = {
          path: path,
          context: path[path.length - 1]
        };

        if (Object.keys(variables).length > 0) { // Check if variables is not empty
          val.variables = variables;
        }

        // Update settings
        settings.plugins[pluginIndex].contexts.push(val);
      } else {
        settings.plugins[pluginIndex].contexts[contextIndex].variables = variables;
      }

      console.log("settings:", settings)

      // Write the updated settings back to the file
      fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));

      res.status(200).json({ message: 'Context updated successfully', settings: settings });

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
