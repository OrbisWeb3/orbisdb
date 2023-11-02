// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import fs from 'fs';
import path from 'path';

// The path to your settings file might need to be adjusted based on your project's structure
const settingsFilePath = path.resolve(process.cwd(), 'orbisdb-settings.json');
console.log("settingsFilePath:", settingsFilePath);
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { context } = req.body;

    try {
      // Ensure the settings file exists or the readFileSync method will throw an error
      if (!fs.existsSync(settingsFilePath)) {
        throw new Error('Settings file does not exist');
      }

      let settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));

      // Check if the context is a sub-context or already exists
      if (context.context) {
        // Find the parent context or the existing context
        let parentOrExistingContext = findContextById(context.context, settings.contexts);

        if (parentOrExistingContext) {
          // Check if we're dealing with a parent context or an existing sub-context
          if (parentOrExistingContext.stream_id === context.context) {
            // It's a sub-context, update it
            updateContext(parentOrExistingContext, context);
          } else {
            // It's a parent context, add the new sub-context
            if (!parentOrExistingContext.contexts) {
              parentOrExistingContext.contexts = []; // Initialize sub-contexts array if not present
            }
            // Update or add the sub-context
            updateContext(parentOrExistingContext.contexts, context);
          }
        } else {
          throw new Error(`Parent context not found for: ${context.context}`);
        }
      } else {
        // If it's not a sub-context, update or add it to the main contexts array
        updateContext(settings.contexts, context);
      }

      console.log("Updated settings:", settings);

      // Rewrite the settings file
      fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));

      // Send the response
      res.status(200).json({
        status: 200,
        settings,
        result: "Context updated in the settings file."
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update settings.' });
    }
  } else {
    // If it's not a POST request, return 405 - Method Not Allowed
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  }
}

// Recursive function to search for a context by its ID
const findContextById = (id, contexts) => {
  for (let ctx of contexts) {
    if (ctx.stream_id === id) {
      return ctx;
    }
    if (ctx.contexts) {
      let foundContext = findContextById(id, ctx.contexts);
      if (foundContext) {
        return foundContext;
      }
    }
  }
  return null;
};

// Function to update an existing context or add a new one
const updateContext = (contexts, newContext) => {
  const index = contexts.findIndex(ctx => ctx.stream_id === newContext.stream_id);
  if (index !== -1) {
    // Context already exists, update it
    contexts[index] = { ...contexts[index], ...newContext };
  } else {
    // Context does not exist, add as new
    contexts.push(newContext);
  }
};
