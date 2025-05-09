/** Wait for x ms in an async function */
export const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

/** Parse a seed from string, or return if it's already in the right format */
export function parseDidSeed(seed) {
  const attemptJsonParse = (string) => {
    try {
      return JSON.parse(string);
    } catch {
      return false;
    }
  };

  const parsedSeed = attemptJsonParse(seed) || seed;

  if (typeof parsedSeed === "string") {
    if (!/^(0x)?[0-9a-f]+$/i.test(seed)) {
      throw "Invalid seed format. It's not a hex string or an array.";
    }
    return seed;
  }

  if (Array.isArray(parsedSeed)) {
    return new Uint8Array(parsedSeed);
  }

  if (parsedSeed instanceof Uint8Array) {
    return parsedSeed;
  }

  throw "Invalid seed format. It's not a hex string or an array.";
}

/** Returns a shortened version of a string */
export function shortAddress(address, number = 5) {
  if (!address) {
    return "-";
  }

  const firstChars = address.substring(0, number);
  const lastChars = address.substr(address.length - number);
  return firstChars.concat("-", lastChars);
}

/** Will extract the address from the did */
export function getAddress(did) {
  // Split the DID string into an array using ':' as the delimiter
  const parts = did.split(":");

  // Return the last element of the array
  return parts[parts.length - 1];
}

// Will copy the cell data to the clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    console.log("Text copied to clipboard");
    alert("Copied to clipboard!");
  } catch (err) {
    console.error("Failed to copy: ", err);
  }
};

/** Will fint the context using the stream id in the contexts and sub-contexts */
export function findContextById(contexts, streamId) {
  if (streamId == "global") {
    return {
      name: "Global",
      stream_id: "global",
    };
  } else if (contexts && Array.isArray(contexts)) {
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
    if (plugins && plugins.length > 0) {
      for (let plugin of plugins) {
        if (plugin.contexts) {
          // Check if contexts are defined for the plugin
          for (let context of plugin.contexts) {
            if (context.context === contextId) {
              // Return the path excluding the last element (the context itself)
              return context.path.slice(0, -1);
            }
          }
        }
      }
    }

    return [];
  };

  const parentContexts = getParentContexts(contextId, plugins);

  if (plugins && plugins.length > 0) {
    plugins.forEach((plugin) => {
      plugin?.contexts?.forEach((context) => {
        // Check for direct installations
        let isDirect = context.context === contextId;

        // Check for parent installations
        let isParent = parentContexts.includes(context.context);

        let pluginDetails = JSON.parse(JSON.stringify(plugin)); // Deep clone the plugin object
        delete pluginDetails.contexts; // Remove the contexts array from the plugin details
        pluginDetails.contextAssigned = context;
        if (isDirect) {
          directPlugins.push({
            ...pluginDetails,
            contextType: "Direct",
            installedContextId: context.context, // Add the exact context ID on which the plugin is installed
          });
        } else if (isParent) {
          parentPlugins.push({
            ...pluginDetails,
            contextType: "Parent",
            installedContextId: context.context, // Add the exact context ID on which the plugin is installed
          });
        }
      });
    });
  }

  return {
    direct: directPlugins,
    parent: parentPlugins,
  };
};

export const countPluginsByContext = () => {
  let results = getPluginsByContext(contextId, plugins);
  console.log("results:", results);
  let countDirect = results.direct.length;
  let countParent = results.parent.length;
  let countTotal = countDirect + countParent;

  return {
    total: countTotal,
    direct: countDirect,
    parent: countTotal,
  };
};

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
      const foundParentId = findParentContextId(
        contextId,
        context.contexts,
        context.stream_id
      );
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
  DISABLED: 4,
};

export async function fetchTablesAndColumns(token, tableName = null) {
  const url = tableName
    ? `/api/db/tables/${tableName}/columns`
    : "/api/db/tables";
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
}

export async function setForeignKey(
  token,
  table,
  column,
  referencedTable,
  referencedColumn
) {
  const response = await fetch("/api/db/foreign-key", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ table, column, referencedTable, referencedColumn }),
  });
  const data = await response.json();
  return data;
}

// Method to get the model ID for a human-readable table name
export function getCleanTableName(settings, model_id) {
  const modelsMapping = settings.models_mapping;
  if (modelsMapping) {
    return modelsMapping[model_id];
  }
}
/** Will remove : from DID to be supported as GraphQL endpoint */
export function cleanDidPath(did) {
  let path = did.replaceAll(":", "_");
  return path;
}
