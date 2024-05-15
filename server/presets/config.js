import { initSocialPreset } from "./social/index.js";

/** Will enable the selected preset */
export async function enablePreset(type, slot) {
    console.log("Enter enablePreset for type: " + type + " / and slot: " + slot);
  
    let db;
    if(slot) {
      console.log("global.indexingService.databases[slot]:", global.indexingService.databases[slot]);
      db =  global.indexingService.databases[slot];
    } else {
      console.log("global.indexingService.database:", global.indexingService.database);
      db = global.indexingService.database;
    }
  
    // Execute preset based on type
    switch(type) {
      case "social":
        initSocialPreset(db);
        break;
    }
  
    return;
}