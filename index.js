(async () => {
    try {
      // Dynamically import the ESM module
      await import('./server/index.mjs');
    } catch (e) {
      console.error('Failed to start the server:', e);
    }
  })();