// You need to import the 'fs' module to use file system functions
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // Adjust the path to where your settings file is located
  console.log("process.cwd():", process.cwd());
  const settingsFilePath = path.join(process.cwd(), 'orbisdb-settings.json');

  if (req.method === 'GET') {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
      res.status(200).json(settings);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to read settings.' });
    }
  } else {
    // Handle any other HTTP method
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
