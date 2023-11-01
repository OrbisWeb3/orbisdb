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

      // Check if the context is a sub-context
      if (context.context) {
        console.log("Parent context is:", context.context);
        // Find the parent context in the existing settings
        let parentContext = findContextById(context.context, settings.contexts);

        // If parent context is found
        if (parentContext) {
          if (!parentContext.contexts) {
            parentContext.contexts = []; // Initialize sub-contexts array if not present
          }
          parentContext.contexts.push(context); // Add the sub-context to the parent context's sub-contexts array
        } else {
          throw new Error('Parent context not found for:', context.context);
        }
      } else {
        // If it's not a sub-context, add it to the main contexts array
        settings.contexts = [...settings.contexts, context];
      }

      console.log("New settings:", settings);

      // Rewrite the settings file
      fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));

      // Send the response
      res.status(200).json({
        status: 200,
        settings,
        result: "Context added to the settings file."
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
