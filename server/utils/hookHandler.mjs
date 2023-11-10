/**
 * Those are all of the hooks used by OrbisDB (others might be added in the future).
 */
const hooks = [
  ["generate", {}],
  ["validate", { isValidator: true }], // Updated the `terminateOnResult` logic. I feel that validators plugins should only be able to return true or false.
  ["add_metadata", {}],
  ["post_process", {}],
];

/**
 * This HookHandle class will be storing all hooks enabled by different plugins used by the indexing instance
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
  async safeExecute(handler, data) {
    try {
      const { pluginsData, ...dataToPass } = data;
      // Execute hook
      return await handler(dataToPass);
    } catch (e) {
      console.log("Error executing hook:", e);
      return { e };
    }
  }

  // TODO: handle hook that are able to overwrite data
  // TODO: handle hooks that are able to return early (next())
  async executeHook(hookName, data = {}) {

    // Retrieve options for the hook to be about to be executed. Can be used for hooks requiring to terminate if results are returned
    const hookOpts = this.registeredHooks[hookName];
    if (!hookOpts) {
      throw `Hook ${hookName} has no been registered.`;
    }

    // Initalize some additional fields which can be used by the plugins
    data.isValid = true;
    data.pluginsData = {};

    // Retrieves all of the hook that should be executed here (based on the hook name subscribed)
    // TODO: Use contextId here in order to be able to retrieve only the hooks of the right context
    const handlers = Object.entries(this.hooks[hookName]);

    // Loop through all handlers to execute them
    for (const [pluginId, handler] of handlers) {
      // Safely execute the hook
      const result = await this.safeExecute(handler, JSON.parse(JSON.stringify(data)));

      // Validator hooks can update the `isValid` field
      if (hookOpts.isValidator) {
        if(result === false) {
          data.isValid = false;
        }
      } else {
        // Save result returned by the plugin in the pluginsData field
        if (result) {
          if (result.error) {
            console.error(`[hook:${hookName}/${pluginId}] Handler error.`, result.error);
            continue;
          }
          data.pluginsData[pluginId] = result;
        }
      }
    }

    return data;
  }

  // Will clean the name to make sure it cotains only lowercase letters (todo: should improve the plugin naming logic)
  sanitizePluginId(id) {
    return id.replace(/[^A-z]*/g, "").toLowerCase();
  }

  // Used to add a specific hook (can be used at runtime as well)
  addHookHandler(hookName, pluginId, contextId, handler = () => {}) {
    if (!this.hooks[hookName]) {
      this.hooks[hookName] = {};
    }

    // TODO: Use contextId here in order to be able to execute only hook when the stream is part of the right context
    this.hooks[hookName][this.sanitizePluginId(pluginId)] = handler;
  }

  // Used to remove a specific hook during runtime
  removeHookHandler(hookName, pluginId) {
    if (!this.hooks[hookName]) {
      return;
    }

    delete this.hooks[hookName][this.sanitizePluginId(pluginId)];
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
