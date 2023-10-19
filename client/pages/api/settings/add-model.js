// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import fs from 'fs';
import path from 'path';

// The path to your settings file might need to be adjusted based on your project's structure
const settingsFilePath = path.resolve(process.cwd(), 'orbisdb-settings.json');
console.log("settingsFilePath:", settingsFilePath);
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { model } = req.body;

    try {
      // Ensure the settings file exists or the readFileSync method will throw an error
      if (!fs.existsSync(settingsFilePath)) {
        throw new Error('Settings file does not exist');
      }

      let settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));

      // Add the new model
      settings.models = [...settings.models, model];

      console.log("New settings:", settings);

      // Rewrite the settings file
      fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));

      // Send the response
      res.status(200).json({
        status: 200,
        settings,
        result: "Model added to the settings file."
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
