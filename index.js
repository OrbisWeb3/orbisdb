import logger from "./server/logger/index.js";

(async () => {
  try {
    // Dynamically import the ESM module
    await import("./server/index.js");
  } catch (e) {
    logger.error("Failed to start the server:", e);
  }
})();
