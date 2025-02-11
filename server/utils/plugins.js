import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import {
  getOrbisDBSettings,
  updateOrAddPlugin,
  updateOrbisDBSettings,
} from "./helpers.js";
import logger from "../logger/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadPlugins() {
  const plugins = [];
  const pluginDir = path.join(__dirname, "../plugins"); // Adjust the path as necessary

  // Read all subdirectories under the "plugins" directory
  const pluginFolders = fs
    .readdirSync(pluginDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const folder of pluginFolders) {
    // Construct the path to the settings.json file for the plugin
    const settingsPath = path.join(pluginDir, folder, "settings.json");

    try {
      // Check if settings.json file exists for the plugin
      if (fs.existsSync(settingsPath)) {
        // Read settings.json file
        const settingsData = fs.readFileSync(settingsPath, "utf-8");
        const settings = JSON.parse(settingsData);

        // Add the loaded settings to the plugins array
        plugins.push(settings);
      } else {
        logger.error(
          `No settings.json found for plugin in folder "${folder}".`
        );
      }
    } catch (error) {
      logger.error(
        `Failed to load settings for plugin in folder "${folder}":`,
        error
      );
    }
  }

  return plugins;
}
// This array will hold all the instantiated and initialized plugins
let loadedPlugins = [];

const getPluginClass = async (plugin) => {
  const pluginsBaseDir = path.join(__dirname, "../plugins");
  const pluginDir = path.join(pluginsBaseDir, plugin.plugin_id);
  const pluginFile = path.join(pluginDir, "index.js");
  const PluginModule = await import(pathToFileURL(pluginFile));

  return PluginModule?.default;
};

export async function installPlugin(plugin, slot) {
  // Retrieve settings for this slot
  const settings = getOrbisDBSettings(slot);

  try {
    // Add the new plugin or update it if already exists
    const updatedSettings = updateOrAddPlugin(settings, plugin);
    const pluginClass = await getPluginClass(plugin);

    // Rewrite the settings file
    // Handle rollback in case of error
    updateOrbisDBSettings(updatedSettings, slot);

    const pluginMessage =
      typeof pluginClass.onInstall === "function"
        ? await pluginClass.onInstall({
            slot: slot || "global",
            variables: plugin.variables,
            plugin_id: plugin.plugin_id,
            orbisdb: global.indexingService.ceramics[slot]?.orbisdb,
          })
        : undefined;

    return { updatedSettings: getOrbisDBSettings(slot), pluginMessage };
  } catch (err) {
    updateOrbisDBSettings(settings, slot);
    logger.error(err);
    return { error: "Failed to update settings." };
  }
}

/** Will load all of the plugins being specified in the settings file and init them with their respective variables */
export async function loadAndInitPlugins() {
  // Reset loaded plugins
  loadedPlugins = [];

  // Retrieve settings
  let settings = getOrbisDBSettings();

  const pluginsBaseDir = path.join(__dirname, "../plugins"); // Adjust the path as necessary

  /** If instance is shared loop through all slots to find plugins */
  const pluginSettings = settings.is_shared
    ? (settings.slots ?? {})
    : { global: { plugins: settings.plugins } };

  for (const [key, slot] of Object.entries(pluginSettings) ?? []) {
    for (const pluginConfig of slot.plugins ?? []) {
      try {
        // Construct paths
        const pluginDir = path.join(pluginsBaseDir, pluginConfig.plugin_id);
        const pluginFile = path.join(pluginDir, "index.js");

        // Dynamic import (as we're in an async function)
        const PluginModule = await import(pathToFileURL(pluginFile));
        const PluginClass = PluginModule.default;

        // Create a new instance of the plugin for each contextualized install
        pluginConfig.contexts?.forEach((context) => {
          let pluginVariables = pluginConfig.variables
            ? pluginConfig.variables
            : null;
          let contextualizedVariables = context.variables;

          /** If any add contextualized variables to the variables using when initializing the plugin */
          if (contextualizedVariables) {
            pluginVariables = {
              ...pluginVariables,
              ...contextualizedVariables,
            };
          }

          /** Initialize plugin */
          const pluginInstance = new PluginClass(pluginVariables);

          /** Assign all variables here instead of using a constructor for all plugins (less error prone for plugin developers) */
          for (let key in pluginVariables) {
            pluginInstance[key] = pluginVariables[key];
          }

          /** Assign plugin's slot dynamically */
          pluginInstance.slot = key;

          /** Assign slot OrbisDB object to plugin */
          pluginInstance.orbisdb = global.indexingService.ceramics[key].orbisdb;

          /** Assign plugin's context dynamically */
          pluginInstance.context = context.context;

          /** Assign plugin's instance unique identifier */
          pluginInstance.uuid = context.uuid;

          /** Assign plugin's ID automatically */
          pluginInstance.id = pluginConfig.plugin_id;

          /** Add plugin initialized to the loaded plugins array */
          loadedPlugins.push(pluginInstance);
        });
      } catch (error) {
        logger.error(`Failed to load plugin ${pluginConfig.plugin_id}:`, error);
        // Handle errors (maybe you want to remove the plugin from the list if it fails)
      }
    }
  }

  return loadedPlugins;
}

/** Will return one plugin object based on the UUID passed */
export async function loadPlugin(plugin_uuid) {
  // Loads all plugins installed
  for (const plugin of loadedPlugins) {
    if (plugin.uuid == plugin_uuid) {
      return plugin;
    }
  }

  return null;
}

/** Will retrieve the plugin id based on the uuid */
export function getPluginIdByUUID(settings, pluginUUID) {
  // Check if settings and pluginUUID are provided
  if (!settings || !pluginUUID) {
    throw new Error("Both settings object and plugin UUID must be provided");
  }

  // Get all contexts
  const contexts = settings.contexts || [];
  const slots = settings.slots || {};

  // Check in global plugins
  const globalPlugins = settings.plugins || [];
  for (let plugin of globalPlugins) {
    const pluginContexts = plugin.contexts || [];
    for (let context of pluginContexts) {
      if (context.uuid === pluginUUID) {
        return plugin.plugin_id;
      }
    }
  }

  // Check in slot-specific plugins
  for (let slotKey in slots) {
    const slot = slots[slotKey];
    const slotPlugins = slot.plugins || [];
    for (let plugin of slotPlugins) {
      const pluginContexts = plugin.contexts || [];
      for (let context of pluginContexts) {
        if (context.uuid === pluginUUID) {
          return plugin.plugin_id;
        }
      }
    }
  }

  // If plugin not found, return null
  return null;
}
