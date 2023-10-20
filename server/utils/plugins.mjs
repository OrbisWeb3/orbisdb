import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadPlugins() {
    const plugins = [];
    const pluginDir = path.join(__dirname, '../plugins'); // Adjust the path as necessary

    // Read all subdirectories under the "plugins" directory
    const pluginFolders = fs.readdirSync(pluginDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    for (const folder of pluginFolders) {
        // Construct the path to the settings.json file for the plugin
        const settingsPath = path.join(pluginDir, folder, 'settings.json');

        try {
            // Check if settings.json file exists for the plugin
            if (fs.existsSync(settingsPath)) {
                // Read settings.json file
                const settingsData = fs.readFileSync(settingsPath, 'utf-8');
                const settings = JSON.parse(settingsData);

                // Add the loaded settings to the plugins array
                plugins.push(settings);
            } else {
                console.error(`No settings.json found for plugin in folder "${folder}".`);
            }
        } catch (error) {
            console.error(`Failed to load settings for plugin in folder "${folder}":`, error);
        }
    }

    console.log("plugins available:", plugins);
    return plugins;
}
