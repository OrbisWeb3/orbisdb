import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { DIDSession } from "did-session";

/** Initialize dirname */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Helpful to delay a function for a few seconds */
export const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

/** Will convert a Ceramic JWT into a readable address */
export async function getAdminDid(authHeader) {
  const token = authHeader.split(" ")[1]; // Split 'Bearer <token>'
  if (token) {
    try {
      let resAdminSession = await DIDSession.fromSession(token, null);
      let didId = resAdminSession.did.parent;
      return didId;
    } catch (e) {
      console.log("Error auth admin:", e);
      return null;
    }
  } else {
    return null;
  }
}

/** Load and returns OrbisDB settings */
export function getOrbisDBSettings(slot) {
  let orbisdbSettings;
  try {
    let _path = path.resolve(__dirname, "../../orbisdb-settings.json");
    const settingsData = fs.readFileSync(_path);
    orbisdbSettings = settingsData.length ? JSON.parse(settingsData) : {};
  } catch (error) {
    console.error(
      "Error reading or parsing orbisdb-settings.json, returning empty settings:",
      error
    );
    orbisdbSettings = {}; // Set a default value or handle the error as per your requirement
  }
  if (slot && orbisdbSettings.is_shared) {
    return orbisdbSettings.slots ? orbisdbSettings.slots[slot] : {};
  } else {
    return orbisdbSettings;
  }
}

/** Update the settings file */
export function updateOrbisDBSettings(updatedSettings, slot) {
  let settingsToSave;

  // Retrieve global settings in order to update the correct slot
  let oldSettings = getOrbisDBSettings();

  /** Build new settings object according to slot */
  if (slot && slot != undefined && slot != "global" && oldSettings.is_shared) {
    if (!oldSettings.slots) {
      oldSettings.slots = {}; // Initialize slots as an array if it's not an array already
    }
    oldSettings.slots[slot] = updatedSettings;
    settingsToSave = oldSettings;
    console.log(
      "Trying to update settings for " + slot + " with:",
      settingsToSave
    );
  } else {
    settingsToSave = updatedSettings;
    console.log("Trying to update global settings with:", settingsToSave);
  }

  /** Save updated settings */
  try {
    let _path = path.resolve(__dirname, "../../orbisdb-settings.json");
    fs.writeFileSync(_path, JSON.stringify(settingsToSave, null, 2));
  } catch (e) {
    console.log("Error updating orbisdb settings:", e);
  }
}

export function findSlotsWithContext(contextId) {
  const foundSlots = [];
  let settings = getOrbisDBSettings();
  let slots = settings.slots;

  // Helper function to search contexts recursively
  function searchContexts(contexts, slotName) {
    for (const context of contexts) {
      if (context.stream_id === contextId) {
        foundSlots.push(slotName);
        break; // Stop searching this slot's contexts if a match is found
      }
      if (context.contexts) {
        searchContexts(context.contexts, slotName); // Recurse into sub-contexts
      }
    }
  }

  // Iterate over each slot
  for (const [slotName, slotDetails] of Object.entries(slots)) {
    if (slotDetails.contexts) {
      searchContexts(slotDetails.contexts, slotName);
    }
  }

  return foundSlots;
}

/** Will convert a did in a valid db name */
export function toValidDbName(input) {
  // Replace invalid characters with underscores
  let validName = input.replace(/[^a-zA-Z0-9]/g, "_");

  // Ensure the name starts with a letter or underscore
  if (!validName.match(/^[a-zA-Z_]/)) {
    validName = "_" + validName;
  }

  // Trim the name to 63 characters to meet PostgreSQL's default limit
  validName = validName.substring(0, 63);

  return validName;
}

/** Retrieve readable table name from model using mapping */
export function getTableName(model) {
  let settings = getOrbisDBSettings();
  if (settings && settings.models_mapping) {
    return settings.models_mapping[model];
  } else {
    return model;
  }
}

// Add a method to get the model ID for a human-readable table name
export function getTableModelId(tableName) {
  let settings = getOrbisDBSettings();
  const modelsMapping = settings.models_mapping;
  for (const [id, name] of Object.entries(modelsMapping || {})) {
    if (name === tableName) {
      return id;
    }
  }
  return undefined;
}

// Recursive function to search for a context by its ID
export const findContextById = (id, contexts) => {
  for (let ctx of contexts) {
    if (ctx.stream_id === id) {
      return ctx;
    }
    if (ctx.contexts) {
      let foundContext = findContextById(id, ctx.contexts);
      if (foundContext) {
        return foundContext;
      }
    }
  }
  return null;
};

// Function to update an existing context or add a new one
export const updateContext = (contexts, newContext) => {
  if (contexts && contexts.length > 0) {
    const index = contexts.findIndex(
      (ctx) => ctx.stream_id === newContext.stream_id
    );
    if (index !== -1) {
      // Context already exists, update it
      contexts[index] = { ...contexts[index], ...newContext };
    } else {
      // Context does not exist, add as new
      contexts.push(newContext);
    }
  } else {
    // If contexts is empty, simply add the new context
    contexts = [newContext];
  }

  console.log("contexts:", contexts);
  return contexts;
};

/** This will check if the plugin exists and either add it to the settings or update the existing one */
export function updateOrAddPlugin(settings, newPlugin) {
  // Check if the plugin already exists
  if (settings.plugins && settings.plugins.length > 0) {
    const existingPluginIndex = settings?.plugins?.findIndex(
      (p) => p.plugin_id === newPlugin.plugin_id
    );

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
