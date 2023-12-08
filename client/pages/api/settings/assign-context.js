// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// The path to your settings file might need to be adjusted based on your project's structure
const settingsFilePath = path.resolve(process.cwd(), 'orbisdb-settings.json');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { plugin_id, path, variables, context_id, uuid } = req.body;
    console.log("plugin_id:", plugin_id);
    console.log("path:", path);

    try {
      // Ensure the settings file exists or the readFileSync method will throw an error
      if (!fs.existsSync(settingsFilePath)) {
        throw new Error('Settings file does not exist');
      }

      let settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));


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
          context: path[path.length - 1],
          uuid: uuidv4() // Assign a unique identifier to this plugin instance on install
        };

        if (Object.keys(variables).length > 0) { // Check if variables is not empty
          val.variables = variables;
        }

        // Update settings
        if(settings.plugins[pluginIndex].contexts) {
          settings.plugins[pluginIndex].contexts.push(val);
        } else {
          settings.plugins[pluginIndex].contexts = [val];
        }

      } else {
        // Update variable for existing plugin instance
        settings.plugins[pluginIndex].contexts[contextIndex].variables = variables;

        // TODO: Update runtime variables for this plugin
        let pluginsInstances = await global.indexingService.plugins;
        console.log("pluginsInstances:", pluginsInstances);
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
      fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));

      // Return results
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
