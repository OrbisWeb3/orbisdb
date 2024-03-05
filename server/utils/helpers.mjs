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
    let _path = path.resolve(__dirname, "../../orbisdb-settings.json");
    console.log("Trying to read settings in getOrbisDBSettings() with path:", _path);
    const settingsData = fs.readFileSync(_path);
    console.log("settingsData:", settingsData);
    orbisdbSettings = settingsData.length ? JSON.parse(settingsData) : {};
    console.log("orbisdbSettings:", orbisdbSettings)
  } catch (error) {
    console.error("Error reading or parsing orbisdb-settings.json, returning empty settings:", error);
    orbisdbSettings = {}; // Set a default value or handle the error as per your requirement
  }
  return orbisdbSettings;
}

/** Update the settings file */
export function updateOrbisDBSettings(updatedSettings) {
  console.log("Trying to update settings in updateOrbisDBSettings()");
  try {
    let _path = path.resolve(__dirname, "../../orbisdb-settings.json");
    console.log("Saving settings in _path:", _path);
    fs.writeFileSync(_path, JSON.stringify(updatedSettings, null, 2));
  } catch(e) {
    console.log("Error updating orbisdb settings:", e);
  }
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