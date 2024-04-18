import { startIndexing } from "../../../index.js";
import { adminDidAuthMiddleware } from "../../../middleware/didAuthMiddleware.js";
import {
  getOrbisDBSettings,
  restartIndexingService,
  updateOrbisDBSettings,
} from "../../../utils/helpers.js";

/** Prefixed with /api/settings/ */
export default async function (server, opts) {
  /** Authenticated scope */
  await server.register(async function (server) {
    await server.addHook("onRequest", adminDidAuthMiddleware);

    // Returns OrbisDB settings
    server.get("/", async (req, res) => {
      console.log("adminDid for /api/settings/get request:", req.adminDid);

      try {
        const settings = getOrbisDBSettings(req.adminDid);

        return {
          settings,
        };
      } catch (err) {
        console.error(err);
        return res.internalServerError("Failed to read settings.");
      }
    });

    server.post("/restart", async (req, res) => {
      console.log(
        cliColors.text.cyan,
        "⚰️ Restarting indexing service...",
        cliColors.reset
      );

      // Stop the current indexing service
      global.indexingService.stop();

      // Start a new indexing service
      startIndexing();

      // Return results
      return {
        result: "Indexing service restarted.",
      };
    });

    server.patch("/:slot?", async (req, res) => {
      const { slot } = req.params;
      const { configuration } = req.body;

      if (slot && slot !== req.adminDid) {
        return res.unauthorized(
          `You're not authorized to make changes to slot ${slot}.`
        );
      }

      console.log("Trying to save:", configuration);

      try {
        // Retrieve current settings
        const settings = getOrbisDBSettings(slot);
        console.log("settings:", settings);

        // Assign new configuration values
        settings.configuration = configuration;

        // Rewrite the settings file
        updateOrbisDBSettings(settings, slot);

        // Restart indexing service
        await restartIndexingService();

        // Send the response
        return {
          updatedSettings: settings,
          result: "New configuration saved.",
        };
      } catch (err) {
        console.error(err);

        return res.internalServerError("Failed to update settings.");
      }
    });
  });

  // Retrieve instance admins
  server.get("/admins/:slot", async (req, res) => {
    const { slot } = req.params;

    try {
      const globalSettings = getOrbisDBSettings();
      if (globalSettings.is_shared) {
        if (!(slot in (globalSettings.slots || {}))) {
          return res.notFound(`Slot ${slot} not found.`);
        }

        // (slot === adminDid for the slot)
        return {
          admins: [slot],
        };
      }

      return {
        admins: globalSettings?.configuration?.admins,
      };
    } catch (err) {
      console.error(err);
      return res.internalServerError("Failed to read settings.");
    }
  });
}
