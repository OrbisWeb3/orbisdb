import logger from "../../../logger/index.js";
import { adminDidAuthMiddleware } from "../../../middleware/didAuthMiddleware.js";
import {
  getOrbisDBSettings,
  toValidDbName,
  updateOrbisDBSettings,
  restartIndexingService,
} from "../../../utils/helpers.js";
import { enablePreset } from "../../../presets/config.js";

const generateSeed = async () => {
  const buffer = new Uint8Array(32);
  const seed = crypto.getRandomValues(buffer);
  const array = Array.from(seed);

  return array;
};

/** Prefixed with /api/setup/ */
export default async function (server, opts) {
  /** Authenticated scope */
  await server.register(async function (server) {
    await server.addHook("onRequest", adminDidAuthMiddleware);

    server.post("/shared", async (req, res) => {
      const { presets } = req.body;
      const adminDid = req.adminDid;
      console.log("adminDid for /api/setup/shared request:", adminDid);

      try {
        // Step 1: Retrieve global configuration to use the global ceramic node and db credentials
        const settings = getOrbisDBSettings();

        // Step 2: Create a new database for this admin did
        const databaseName = toValidDbName(adminDid);
        try {
          await global.indexingService.database.createDatabase(databaseName);
        } catch (e) {
          console.log("Error creating db:", e);
        }

        // Step 3: Generate a new seed for the new user of the shared instance
        const seed = await generateSeed();

        // Step 4: Build new credentials configuration in settings for this user
        const ceramicConfiguration = settings.configuration.ceramic;
        ceramicConfiguration.seed = seed;

        const dbConfiguration = { ...settings.configuration.db };
        dbConfiguration.database = databaseName;

        const slotSettings = {
          configuration: {
            ceramic: ceramicConfiguration,
            db: dbConfiguration,
          },
        };

        // Apply to global settings
        if (!settings.slots) {
          settings.slots = {}; // Initialize slots as an array if it's not an array already
        }

        settings.slots[adminDid] = slotSettings;

        // Step 5: Update global settings
        updateOrbisDBSettings(settings);

        // Step 6: Restart indexing service
        await restartIndexingService(settings);
        console.log("After restartIndexingService");

        // If user enabled some presets we run those
        if (presets && presets.length > 0) {
          console.log("presets:", presets);
          await Promise.all(
            presets.map((preset) => enablePreset(preset, adminDid))
          );
          console.log("Presets enabled for shared instance:", presets);
        }

        // Return results
        return {
          result: "New database created in the shared instance.",
          updatedSettings: slotSettings,
        };
      } catch (e) {
        logger.error("Error setup shared configuration db:", e);

        return {
          result: "Error creating database.",
        };
      }
    });
  });

  /** Will check if the node has already been configred or not */
  server.get("/status", async (req, res) => {
    try {
      const settings = getOrbisDBSettings();
      if (!settings) {
        return {
          is_configured: false,
          is_shared: false,
        };
      }

      // Map over the slots array to include only the id and title of each slot
      if (settings.is_shared) {
        return {
          is_configured: settings.configuration ? true : false,
          is_shared: true,
        };
      }

      return {
        is_configured: settings.configuration ? true : false,
        is_shared: false,
      };
    } catch (err) {
      logger.error(err);

      return {
        is_shared: false,
        is_configured: false,
      };
    }
  });
}
