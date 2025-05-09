import fs from "fs";
import path from "path";

/** Will enable the selected preset */
export async function enablePreset(type, slot) {
  console.log("Enter enablePreset for type: " + type + " / and slot: " + slot);

  let db;
  if (slot) {
    console.log(
      "global.indexingService.databases[slot]:",
      global.indexingService.databases[slot]
    );
    db = global.indexingService.databases[slot];
  } else {
    console.log(
      "global.indexingService.database:",
      global.indexingService.database
    );
    db = global.indexingService.database;
  }

  // Load the preset JSON file
  const presetFilePath = path.resolve(
    `./server/presets/definitions/${type}.json`
  );
  const presetData = JSON.parse(fs.readFileSync(presetFilePath, "utf-8"));

  // Execute preset models and views
  for (const model of presetData.models) {
    await db.indexModel(model);
  }

  for (const view of presetData.views) {
    await db.query(view.query);
  }

  return;
}
