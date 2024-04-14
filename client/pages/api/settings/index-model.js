// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import fs from "fs";
import path from "path";

// The path to your settings file might need to be adjusted based on your project's structure
const settingsFilePath = path.resolve(process.cwd(), "orbisdb-settings.json");

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { modelId } = req.body;

    try {
      // Ensure the settings file exists or the readFileSync method will throw an error
      if (!fs.existsSync(settingsFilePath)) {
        throw new Error("Settings file does not exist");
      }

      let settings = JSON.parse(fs.readFileSync(settingsFilePath, "utf8"));
      // Setup DB to create the new table
      // ... todo

      // Find the index of the model in the array
      const modelIndex = settings.models.findIndex(
        (model) => model.stream_id === modelId
      );

      // Handle the case where the model is not found
      if (modelIndex === -1) {
        res
          .status(404)
          .json({ error: `Model with stream_id ${targetStreamId} not found` });
        return;
      }

      // Update the status to 2
      settings.models[modelIndex].status = 2;
      console.log("New settings:", settings);

      // Rewrite the settings file
      fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));

      // Send the response
      res.status(200).json({
        status: 200,
        settings,
        result: "Model status updated",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update settings." });
    }
  } else {
    // If it's not a POST request, return 405 - Method Not Allowed
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  }
}
