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

/** Use enum instead of magic numbers for statuses */
export const STATUS = {
  ACTIVE: 0,
  LOADING: 1,
  SUCCESS: 2,
  ERROR: 3,
};
