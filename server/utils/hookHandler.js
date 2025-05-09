import logger from "../logger/index.js";

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
  async safeExecute(handler, data) {
    try {
      const { pluginsData, ...dataToPass } = data;
      // Execute hook
      return await handler(dataToPass);
    } catch (e) {
      logger.error("Error executing hook:", e);
      return { error: e };
    }
  }

  // TODO: handle hooks that are able to return early (next())
  // TODO: figure our why having the same plugin installed on the same context with the same hook isn't working well (especially for update and add_metadata)
  /**
   *
   * @param {*} hookName
   * @param {*} data
   * @param {*} contextId : Context ID used by the stream on which the hook is executed. Can be a stream id or null
   * @returns
   */
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
      if (
        !this.hooks[hookName] ||
        (!this.hooks[hookName][contextId] && !this.hooks[hookName]["global"])
      ) {
        return data;
      }
      const contextHandlers = this.hooks[hookName][contextId]
        ? Object.entries(this.hooks[hookName][contextId])
        : [];
      const globalHandlers = this.hooks[hookName]["global"]
        ? Object.entries(this.hooks[hookName]["global"])
        : [];

      // We are using both the contextualized hook handlers as well as the global ones
      handlers = [...contextHandlers, ...globalHandlers];
    } else {
      // Retrieve all handlers for global hooks.
      if (!this.hooks[hookName]) {
        return data;
      }
      handlers = Object.entries(this.hooks[hookName]);
    }

    // Loop through all handlers to execute them.
    for (const [pluginId, contextualizedPlugin] of handlers) {
      // Safely execute the hook.
      let result;
      try {
        if (hookName == "generate") {
          result = this.safeExecute(
            contextualizedPlugin.handler,
            JSON.parse(JSON.stringify(data))
          );
        } else {
          result = await this.safeExecute(
            contextualizedPlugin.handler,
            JSON.parse(JSON.stringify(data))
          );
        }
      } catch (e) {
        console.log("Error executing hook:", e);
      }

      // Handle hook executed based on its type
      if (result?.error) {
        logger.error(
          `[hook:${hookName}/${pluginId}] Handler error.`,
          result.error
        );
        continue;
      }

      // Will handle the result of the executed hook based on the hook type
      switch (hookName) {
        case "add_metadata":
          if (hookData.pluginsData[contextualizedPlugin.pluginId]) {
            hookData.pluginsData[contextualizedPlugin.pluginId].push(result);
          } else {
            hookData.pluginsData[contextualizedPlugin.pluginId] = [result];
          }
          break;
        case "validate":
          if (result == false) {
            hookData.isValid = false;
          }
          break;
        case "update":
        //return result;
        case "generate":
          console.log("Handling generate hook.");
          break;
      }
    }

    return hookData;
  }

  // Will clean the name to make sure it cotains only lowercase letters (todo: should improve the plugin naming logic)
  sanitizePluginId(id) {
    return id.replace(/[^A-z]*/g, "").toLowerCase();
  }

  // Used to add a specific hook (can be used at runtime as well)
  addHookHandler(
    hookName,
    pluginId,
    pluginUuid,
    contextId,
    handler = () => {}
  ) {
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
      this.hooks[hookName][contextId][pluginUuid] = { pluginId, handler };
    } else {
      // Global hooks do not depend on contextId
      this.hooks[hookName][pluginUuid] = { pluginId, handler };
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
