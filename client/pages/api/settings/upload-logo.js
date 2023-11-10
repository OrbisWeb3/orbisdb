import { IncomingForm } from 'formidable';
import fs from "fs";
import path from 'path';

export const config = {
  api: {
    bodyParser: false
  }
};

const settingsFilePath = path.resolve(process.cwd(), 'orbisdb-settings.json');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const form = new IncomingForm();
      form.uploadDir = path.join(process.cwd(), 'client', 'public', 'uploads');
      console.log("form.uploadDir:", form.uploadDir);
      form.keepExtensions = true;
      form.parse(req, (err, fields, files) => {
        if (err) {
          res.status(500).json({ error: 'There was an error processing your upload' });
          return;
        }
        // Assuming the file field in the form is named 'file'
        const file = files.file[0];
        console.log("file:", file);
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

        // Respond with the URL to the uploaded file
        res.status(200).json({ filePath: `/uploads/${filename}` });
      });
    } catch(e) {
      res.status(300).json({ error: e });
    }
  }
}
