import logger from "../../../logger/index.js";
import { adminDidAuthMiddleware } from "../../../middleware/didAuthMiddleware.js";
import {
  findContextById,
  getOrbisDBSettings,
  updateContext,
  updateOrbisDBSettings,
} from "../../../utils/helpers.js";

/** Prefixed with /api/contexts/ */
export default async function (server, opts) {
  await server.register(async function (server) {
    await server.addHook("onRequest", adminDidAuthMiddleware);

    // Create a context
    server.post("/", async (req, res) => {
      const { context: _context } = req.body;
      const context = JSON.parse(_context);

      const adminDid = req.adminDid;

      const settings = getOrbisDBSettings(adminDid);

      try {
        // Check if the context is a sub-context or already exists
        if (context.context) {
          // Find the parent context or the existing context
          let parentOrExistingContext = findContextById(
            context.context,
            settings.contexts
          );

          if (parentOrExistingContext) {
            // Check if we're dealing with a parent context or an existing sub-context
            // It's a parent context, add the new sub-context
            if (!parentOrExistingContext.contexts) {
              parentOrExistingContext.contexts = []; // Initialize sub-contexts array if not present
            }
            logger.debug("parentOrExistingContext:", parentOrExistingContext);
            if (parentOrExistingContext.stream_id === context.context) {
              // It's a sub-context, update it
              logger.debug("It's a sub-context, update it.");
              parentOrExistingContext.contexts = updateContext(
                parentOrExistingContext.contexts,
                context
              );
            } else {
              // Update or add the sub-context
              parentOrExistingContext.contexts = updateContext(
                parentOrExistingContext.contexts,
                context
              );
            }
          } else {
            throw new Error(`Parent context not found for: ${context.context}`);
          }
        } else {
          // If it's not a sub-context, update or add it to the main contexts array
          settings.contexts = updateContext(settings.contexts, context);
          logger.debug("Updated contexts with:", settings.contexts);
        }

        logger.debug("Updated settings:", settings);

        // Rewrite the settings file
        updateOrbisDBSettings(settings, adminDid);

        // Send the response
        return {
          settings,
          context,
          result: "Context updated in the settings file.",
        };
      } catch (err) {
        logger.error(err);

        return res.internalServerError("Failed to update settings.");
      }
    });
  });
}
