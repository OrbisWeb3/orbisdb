// You need to import the 'fs' module to use file system functions
import { getOrbisDBSettings } from "../../../../server/utils/helpers.mjs";

export default function handler(req, res) {
  try {
    const settings = getOrbisDBSettings();
    res.status(200).json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read settings.' });
  }
}
