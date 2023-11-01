import { useContext } from "react";
import { GlobalContext } from "../contexts/Global";


/** Wait for x ms in an async function */
export const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

/** Returns a shortened version of a string */
export function shortAddress(address, number = 5) {
  if(!address) {
    return "-";
  }

  const firstChars = address.substring(0, number);
  const lastChars = address.substr(address.length - number);
  return firstChars.concat('-', lastChars);
}

/** Will fint the context using the stream id in the contexts and sub-contexts */
export function findContextById(contexts, streamId) {
  if(contexts && Array.isArray(contexts)) {
    for (let context of contexts) {
        // Check if the current context's stream_id matches the target
        if (context.stream_id === streamId) {
            return context;
        }

        // If this context has sub-contexts, recursively search them
        if (context.contexts && Array.isArray(context.contexts)) {
            let found = findContextById(context.contexts, streamId);
            if (found) {
                return found;
            }
        }
    }
  }

  // If we've looped through all contexts and haven't found a match, return null
  return null;
}

/** Will return a list of plugins used by a context (also includes plugins being used by parent context) */
export const getPluginsByContext = (contextId, plugins) => {
  let directPlugins = [];
  let parentPlugins = [];

  // Function to extract parent context IDs for a given context ID
  const getParentContexts = (contextId, plugins) => {
    for (let plugin of plugins) {
      if (plugin.contexts) { // Check if contexts are defined for the plugin
        for (let context of plugin.contexts) {
          if (context.context === contextId) {
              // Return the path excluding the last element (the context itself)
              return context.path.slice(0, -1);
          }
        }
      }
    }
    return [];
  }

  const parentContexts = getParentContexts(contextId, plugins);

  plugins.forEach(plugin => {
    plugin?.contexts?.forEach(context => {
      // Check for direct installations
      let isDirect = context.context === contextId;

      // Check for parent installations
      let isParent = parentContexts.includes(context.context);

      let pluginDetails = JSON.parse(JSON.stringify(plugin)); // Deep clone the plugin object
      delete pluginDetails.contexts; // Remove the contexts array from the plugin details

      if (isDirect) {
        directPlugins.push({
          ...pluginDetails,
          contextType: 'Direct',
          installedContextId: context.context // Add the exact context ID on which the plugin is installed
        });
      } else if (isParent) {
        parentPlugins.push({
          ...pluginDetails,
          contextType: 'Parent',
          installedContextId: context.context // Add the exact context ID on which the plugin is installed
        });
      }
    });
  });

  return {
    direct: directPlugins,
    parent: parentPlugins
  };
}


/** Finds and returns the direct parent context of a given context ID. */
export const findParentContextId = (contextId, contexts, parentId = null) => {
  if (!contexts || contexts.length === 0) {
    return null;
  }

  for (const context of contexts) {
    if (context.stream_id === contextId) {
      return parentId;
    }
    if (context.contexts) {
      const foundParentId = findParentContextId(contextId, context.contexts, context.stream_id);
      if (foundParentId) {
        return foundParentId;
      }
    }
  }
  return null;
};

/** Use enum instead of magic numbers for statuses */
export const STATUS = {
  ACTIVE: 0,
  LOADING: 1,
  SUCCESS: 2,
  ERROR: 3,
  DISABLED: 4
};
