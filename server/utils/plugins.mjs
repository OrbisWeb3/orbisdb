import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadPlugins() {
    const plugins = [];
    const pluginDir = path.join(__dirname, '../plugins'); // Adjust the path as necessary

    // Read all subdirectories under the "plugins" directory
    const pluginFolders = fs.readdirSync(pluginDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    for (const folder of pluginFolders) {
        // Construct the path to the settings.json file for the plugin
        const settingsPath = path.join(pluginDir, folder, 'settings.json');

        try {
            // Check if settings.json file exists for the plugin
            if (fs.existsSync(settingsPath)) {
                // Read settings.json file
                const settingsData = fs.readFileSync(settingsPath, 'utf-8');
                const settings = JSON.parse(settingsData);

                // Add the loaded settings to the plugins array
                plugins.push(settings);
            } else {
                console.error(`No settings.json found for plugin in folder "${folder}".`);
            }
        } catch (error) {
            console.error(`Failed to load settings for plugin in folder "${folder}":`, error);
        }
    }

    return plugins;
}

/** Will load all of the plugins being specified in the settings file and init them with their respective variables */
export async function loadAndInitPlugins() {
  const settingsPath = path.join(__dirname, '../../orbisdb-settings.json');
  const settingsContent = fs.readFileSync(settingsPath, 'utf-8');
  let appSettings = JSON.parse(settingsContent);

  const pluginsBaseDir = path.join(__dirname, '../plugins'); // Adjust the path as necessary

  // This array will hold all the instantiated and initialized plugins
  const loadedPlugins = [];

  for (const pluginConfig of appSettings.plugins) {
    try {
      // Construct paths
      const pluginDir = path.join(pluginsBaseDir, pluginConfig.plugin_id);
      const pluginFile = path.join(pluginDir, 'index.mjs');

      // Dynamic import (as we're in an async function)
      const PluginModule = await import(pluginFile);
      const PluginClass = PluginModule.default;

      // Create a new instance of the plugin
      const pluginInstance = new PluginClass(pluginConfig.variables ? pluginConfig.variables : null);
      loadedPlugins.push(pluginInstance);
    } catch (error) {
      console.error(`Failed to load plugin ${pluginConfig.plugin_id}:`, error);
      // Handle errors (maybe you want to remove the plugin from the list if it fails)
    }
  }

  return loadedPlugins;
}
