import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

/** Initialize dirname */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Helpful to delay a function for a few seconds */
export const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

/** Load and returns OrbisDB settings */
export function getOrbisDBSettings() {
  let orbisdbSettings;
  try {
    const settingsData = fs.readFileSync(path.resolve(__dirname, "../../orbisdb-settings.json"));
    orbisdbSettings = settingsData.length ? JSON.parse(settingsData) : {};
  } catch (error) {
    console.error("Error reading or parsing orbisdb-settings.json, returning empty settings.");
    orbisdbSettings = {}; // Set a default value or handle the error as per your requirement
  }
  return orbisdbSettings;
}

/** Update the settings file */
export function updateOrbisDBSettings(updatedSettings) {
  fs.writeFileSync(path.resolve(__dirname, "../../orbisdb-settings.json"), JSON.stringify(updatedSettings, null, 2));
}

/** Retrieve readable table name from model using mapping */
export function getTableName(model) {
  let settings = getOrbisDBSettings();
  if(settings && settings.models_mapping) {
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