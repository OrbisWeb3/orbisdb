/**
 * Those are all of the hooks used by OrbisDB (others might be added in the future).
 */
const hooks = [
  ["generate", { isContextualized: false }],
  ["validate", { isContextualized: true }],
  ["add_metadata", { isContextualized: true }],
  ["update", { isContextualized: true }],
  ["post_process", { isContextualized: true }],
];

/**
 * This HookHandler class will be storing all hooks enabled by different plugins used by the indexing instance
 * as well as execute all of them safely.
 */
export default class HookHandler {
  constructor() {
    this.hooks = {};
    this.registeredHooks = {};

    // Register all of the active hooks currently used
    hooks.forEach((v) => this.registerHook(...v));
  }

  // Execute the hook or returns an error
  async safeExecute(handler, data, contextId) {
    try {
      const { pluginsData, ...dataToPass } = data;
      // Execute hook
      return await handler(dataToPass);
    } catch (e) {
      console.log("Error executing hook:", e);
      return { e };
    }
  }

  // TODO: handle hooks that are able to return early (next())
  // TODO: figure our why having the same plugin installed on the same context with the same hook isn't working well (especially for update and add_metadata)
  async executeHook(hookName, data = {}, contextId) {
    // Retrieve options for the hook to be about to be executed.
    const hookOpts = this.registeredHooks[hookName];
    if (!hookOpts) {
      throw `Hook ${hookName} has not been registered.`;
    }

    // Initialize some additional fields which can be used by the plugins.
    let hookData = { ...data };
    hookData.isValid = true;
    hookData.pluginsData = {};

    // Determine if the hook is contextualized and get the relevant contextId.
    const isContextualized = hookOpts.isContextualized;
    let handlers;

    if (isContextualized) {
      // Retrieve handlers specific to the context if the hook is contextualized.
      if (!this.hooks[hookName] || !this.hooks[hookName][contextId]) {
        return data;
      }
      handlers = Object.entries(this.hooks[hookName][contextId]);
    } else {
      // Retrieve all handlers for global hooks.
      if (!this.hooks[hookName]) {
        console.warn(`No handlers found for global hook ${hookName}`);
        return data;
      }
      handlers = Object.entries(this.hooks[hookName]);
    }

    // Loop through all handlers to execute them.
    for (const [pluginId, handler] of handlers) {
      // Safely execute the hook.
      const result = await this.safeExecute(
        handler,
        JSON.parse(JSON.stringify(data))
      );
      // Handle hook executed based on its type
      if (result?.error) {
        console.error(
          `[hook:${hookName}/${pluginId}] Handler error.`,
          result.error
        );
        continue;
      }

      // Will handle the result of the executed hook based on the hook type
      switch (hookName) {
        case "add_metadata":
          hookData.pluginsData[pluginId] = result;
          break;
        case "validate":
          if (result == false) {
            hookData.isValid = false;
          }
          break;
        case "update":
          return result;
      }
    }

    return hookData;
  }

  // Will clean the name to make sure it cotains only lowercase letters (todo: should improve the plugin naming logic)
  sanitizePluginId(id) {
    return id.replace(/[^A-z]*/g, "").toLowerCase();
  }

  // Used to add a specific hook (can be used at runtime as well)
  addHookHandler(hookName, pluginId, contextId, handler = () => {}) {
    const isContextualized = this.registeredHooks[hookName]?.isContextualized;
    const sanitizedPluginId = this.sanitizePluginId(pluginId);

    if (!this.hooks[hookName]) {
      this.hooks[hookName] = {};
    }

    if (isContextualized) {
      // Contextualized hooks will be stored under a specific context
      if (!this.hooks[hookName][contextId]) {
        this.hooks[hookName][contextId] = {};
      }
      this.hooks[hookName][contextId][sanitizedPluginId] = handler;
    } else {
      // Global hooks do not depend on contextId
      this.hooks[hookName][sanitizedPluginId] = handler;
    }
  }

  // Used to remove a specific hook during runtime
  removeHookHandler(hookName, pluginId, contextId) {
    if (!this.hooks[hookName]) {
      return;
    }

    if (!this.hooks[contextId]) {
      return;
    }

    delete this.hooks[contextId][this.sanitizePluginId(pluginId)];
  }

  // This is registering a hook in order execute them at the right time
  registerHook(hookName, opts) {
    if (!this.registeredHooks[hookName]) {
      this.registeredHooks[hookName] = opts;
    }

    if (!this.hooks[hookName]) {
      this.hooks[hookName] = {};
    }
  }
}
