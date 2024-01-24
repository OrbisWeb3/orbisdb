// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import fs from 'fs';
import path from 'path';

// The path to your settings file might need to be adjusted based on your project's structure
const settingsFilePath = path.resolve(process.cwd(), 'orbisdb-settings.json');
console.log("settingsFilePath:", settingsFilePath);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { plugin } = req.body;
    console.log("Trying to add:", plugin);

    try {
      // Ensure the settings file exists or the readFileSync method will throw an error
      if (!fs.existsSync(settingsFilePath)) {
        throw new Error('Settings file does not exist');
      }

      let settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));

      // Add the new plugin or update it if already exists
      const updatedSettings = updateOrAddPlugin(settings, plugin);

      console.log("New settings:", updatedSettings);

      // Rewrite the settings file
      fs.writeFileSync(settingsFilePath, JSON.stringify(updatedSettings, null, 2));

      // Send the response
      res.status(200).json({
        status: 200,
        updatedSettings,
        result: "New plugin added to the settings file."
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

/** This will check if the plugin exists and either add it to the settings or update the existing one */
function updateOrAddPlugin(settings, newPlugin) {
  // Check if the plugin already exists
  if(settings.plugins && settings.plugins.length > 0) {
    const existingPluginIndex = settings?.plugins?.findIndex(p => p.plugin_id === newPlugin.plugin_id);

    if (existingPluginIndex && existingPluginIndex !== -1) {
      // The plugin exists, update its variables
      settings.plugins[existingPluginIndex].variables = newPlugin.variables;
    } else {
      // The plugin doesn't exist, add it to the list
      settings.plugins = [...settings?.plugins, newPlugin];
    }
  } else {
    settings.plugins = [newPlugin];
  }

  return settings; // Return the modified settings
  
}
