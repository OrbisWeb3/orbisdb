(async () => {
  try {
    // Dynamically import the ESM module
    await import("./server/index.js");
  } catch (e) {
    console.error("Failed to start the server:", e);
  }
})();
