import { startIndexing } from "../../../index.js";
import logger from "../../../logger/index.js";
import { adminDidAuthMiddleware } from "../../../middleware/didAuthMiddleware.js";
import {
  getOrbisDBSettings,
  restartIndexingService,
  updateOrbisDBSettings,
} from "../../../utils/helpers.js";
import { enablePreset } from "../../../presets/config.js";

/** Prefixed with /api/settings/ */
export default async function (server, opts) {
  /** Authenticated scope */
  await server.register(async function (server) {
    await server.addHook("onRequest", adminDidAuthMiddleware);

    // Returns OrbisDB settings
    server.get("/", async (req, res) => {
      try {
        const settings = getOrbisDBSettings(req.adminDid);

        return {
          settings,
        };
      } catch (err) {
        logger.error(err);
        return res.internalServerError("Failed to read settings.");
      }
    });

    server.post("/restart", async (req, res) => {
      logger.debug(
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

    server.put("/", async (req, res) => {
      if (!req.isNodeOwner) {
        return res.unauthorized(
          "Only the node's owner can modify the entire settings file."
        );
      }

      const newSettings = req.body;
      if (!newSettings.configuration) {
        return res.badRequest(
          `New settings are missing a required field: "configuration"`
        );
      }

      logger.debug("Trying to replace settings with:", newSettings);

      try {
        // Retrieve current settings
        const settings = getOrbisDBSettings();
        logger.debug("Current settings:", settings);
        logger.debug("New settings:", newSettings);

        // Rewrite the settings file
        updateOrbisDBSettings(newSettings);

        // Restart indexing service
        await restartIndexingService();

        // Send the response
        return {
          updatedSettings: settings,
          result: "New configuration saved.",
        };
      } catch (err) {
        logger.error(err);

        return res.internalServerError("Failed to replace settings.");
      }
    });

    server.patch("/:slot?", async (req, res) => {
      const { slot } = req.params;
      const { configuration, presets } = req.body;

      if (slot && slot !== req.adminDid) {
        return res.unauthorized(
          `You're not authorized to make changes to slot ${slot}.`
        );
      }

      logger.debug("Trying to save:", configuration);
      logger.debug("Trying to enable presets:", presets);

      try {
        // Retrieve current settings
        const settings = getOrbisDBSettings(slot);
        logger.debug("settings:", settings);

        // Assign new configuration values
        settings.configuration = configuration;

        // Rewrite the settings file
        updateOrbisDBSettings(settings, slot);

        // Restart indexing service
        await restartIndexingService();

        // If user enabled some presets we run those
        if (presets && presets.length > 0) {
          await Promise.all(
            presets.map((preset) => enablePreset(preset, slot))
          );
          console.log("Presets enabled:", presets);
        }

        // Send the response
        return {
          updatedSettings: settings,
          result: "New configuration saved.",
        };
      } catch (err) {
        logger.error(err);

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
        /*if (!(slot in (globalSettings.slots || {}))) {
          return res.notFound(`Slot ${slot} not found.`);
        }*/

        let _isGlobalAdmin =
          globalSettings?.configuration?.admins?.includes(slot);

        // (slot === adminDid for the slot)
        return {
          admins: [slot],
          globalAdmins: globalSettings?.configuration?.admins,
          globalSettings: _isGlobalAdmin ? globalSettings : null,
        };
      }

      return {
        admins: globalSettings?.configuration?.admins,
      };
    } catch (err) {
      logger.error(err);
      return res.internalServerError("Failed to read settings.");
    }
  });

  // Get Analytics for this instance
  server.get("/analytics", async (req, res) => {
    try {
      const globalSettings = getOrbisDBSettings();
      return {
        count_slots: globalSettings.slots ? globalSettings.slots.length : 0,
      };
    } catch (err) {
      logger.error(err);
      return res.internalServerError("Failed to read settings.");
    }
  });
}
