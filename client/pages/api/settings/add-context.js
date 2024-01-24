import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false
  }
};

// The path to your settings file might need to be adjusted based on your project's structure
const settingsFilePath = path.resolve(process.cwd(), 'orbisdb-settings.json');

export default async function handler(req, res) {

  // Ensure the settings file exists or the readFileSync method will throw an error
  if (!fs.existsSync(settingsFilePath)) {
    throw new Error('Settings file does not exist');
  }

  let settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));

  console.log("Enter add-context handler.");
  let logoPath;
  if (req.method === 'POST') {
      const form = new IncomingForm();
      form.uploadDir = path.join(process.cwd(), 'client', 'public', 'uploads');
      console.log("form.uploadDir:", form.uploadDir);
      form.keepExtensions = true;
      form.parse(req, (err, fields, files) => {
        /** Step 1: Try to upload the image */
        try {
          if (err) {
            res.status(500).json({ error: 'There was an error processing your upload' });
            return;
          }

          // Assuming the file field in the form is named 'file'
          if(files?.file) {
            const file = files.file[0];
            console.log("file:", file);
            console.log("fields:", fields);
            console.log("file.filepath:", file.filepath);

            // Extract the file extension
           const originalName = file.originalFilename;
           const fileExtension = path.extname(originalName); // This should give you the extension including the dot, like '.jpg'

           const uniqueName = path.basename(file.newFilename); // Formidable's generated name without extension
           const filename = uniqueName + fileExtension; // Append the original extension

            // Generate a unique filename or use the original name securely
            console.log("filename:", filename);
            console.log("fileExtension:", fileExtension);
            let _path = path.join(form.uploadDir, filename);
            console.log("_path:", _path);

            // Move the file from the temporary directory to the public directory
            fs.renameSync(file.filepath, _path);
            logoPath = `/uploads/${filename}`;
          }
        } catch(e) {
          console.log("Error uploading logo:", e);
        }

        /** Sept 2: Update context locally */
        console.log("logoPath:", logoPath);
        let { context } = fields;
        context = JSON.parse(context);
        if(logoPath) {
          context.logo = logoPath;
        }

        try {
          // Check if the context is a sub-context or already exists
          if (context.context) {
            // Find the parent context or the existing context
            let parentOrExistingContext = findContextById(context.context, settings.contexts);

            if (parentOrExistingContext) {
              // Check if we're dealing with a parent context or an existing sub-context
              // It's a parent context, add the new sub-context
              if (!parentOrExistingContext.contexts) {
                parentOrExistingContext.contexts = []; // Initialize sub-contexts array if not present
              }
              console.log("parentOrExistingContext:", parentOrExistingContext);
              if (parentOrExistingContext.stream_id === context.context) {
                // It's a sub-context, update it
                console.log("It's a sub-context, update it.");
                parentOrExistingContext.contexts = updateContext(parentOrExistingContext.contexts, context);
              } else {
                // Update or add the sub-context
                parentOrExistingContext.contexts = updateContext(parentOrExistingContext.contexts, context);
              }
            } else {
              throw new Error(`Parent context not found for: ${context.context}`);
            }
          } else {
            // If it's not a sub-context, update or add it to the main contexts array
            settings.contexts = updateContext(settings.contexts, context);
            console.log("Updated contexts with:", settings.contexts);
          }

          console.log("Updated settings:", settings);

          // Rewrite the settings file
          fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));

          // Send the response
          res.status(200).json({
            status: 200,
            settings,
            context,
            result: "Context updated in the settings file."
          });

        } catch (err) {
          console.error(err);
          res.status(500).json({ error: 'Failed to update settings.' });
        }
      });
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
  if(contexts && contexts.length > 0) {
    const index = contexts.findIndex(ctx => ctx.stream_id === newContext.stream_id);
    if (index !== -1) {
      // Context already exists, update it
      contexts[index] = { ...contexts[index], ...newContext };
    } else {
      // Context does not exist, add as new
      contexts.push(newContext);
    }
  } else {
    // If contexts is empty, simply add the new context
    contexts = [newContext];
  }

  console.log("contexts:", contexts);
  return contexts; 
};
