import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import {
  getOrbisDBSettings,
  sleep,
  updateContext,
  updateOrbisDBSettings,
} from "../../utils/helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getSettings = () => {
  if (fs.existsSync(resolve(__dirname, "./db.plugin_data"))) {
    return JSON.parse(fs.readFileSync(resolve(__dirname, "./db.plugin_data")));
  }

  fs.writeFileSync(resolve(__dirname, "./db.plugin_data"), "{}");
  return {};
};

const saveResults = (slot, results) => {
  const current = getSettings();
  if (current[slot]) {
    current[slot] = Array.from(new Set([...current[slot], ...results]));
  } else {
    current[slot] = results;
  }

  fs.writeFileSync(
    resolve(__dirname, "./db.plugin_data"),
    JSON.stringify(current)
  );
};

const CODEX_CONTEXT = {
  name: "CODEX Shared context",
  description:
    "Context used to sync up shared streams referencing ResearchObjects.",
  stream_id: "kjzl6kcym7w8y8hvwcecb8kqk15xaeziwj4goxgvngyttuv6o799vpp7s91g49o",
};

export default class DesciModelsPlugin {
  constructor() {
    this.progress = 0;
    this.logs = [];
  }

  static async onInstall({ slot, variables, plugin_id, orbisdb }) {
    const settings = getOrbisDBSettings(slot);

    let assigned_uuid;

    // Append a CODEX context to the environment
    settings.contexts = updateContext(settings.contexts, CODEX_CONTEXT);

    // Enable the plugin inside the newly added CODEX context
    settings.plugins = settings.plugins.map((plugin) => {
      if (plugin.plugin_id !== plugin_id) {
        return plugin;
      }

      const contexts = plugin.contexts || [];
      if (
        contexts.find(
          (context) => context.stream_id === CODEX_CONTEXT.stream_id
        )
      ) {
        return plugin;
      }

      assigned_uuid = uuidv4();

      contexts.push({
        path: [CODEX_CONTEXT.stream_id],
        slot,
        context: CODEX_CONTEXT.stream_id,
        uuid: assigned_uuid,
      });

      return {
        ...plugin,
        contexts,
      };
    });

    updateOrbisDBSettings(settings, slot);

    if (assigned_uuid) {
      global.indexingService.restartPlugins();
    }

    return `Install hook for ${slot} with ${variables}. Plugin: ${plugin_id}. Successfully executed install callback.`;
  }

  async init() {
    return {
      HOOKS: {
        generate: () => this.start(),
      },
    };
  }

  // Will expose dynamic variables that can be exposed on the frontend
  async getDynamicVariables() {
    let results = [];

    // Set color for badges
    let badgeReady =
      "flex bg-sky-50 text-sky-900 rounded-full px-3 py-1 text-xs font-medium border border-sky-200";
    let badgeProcessing =
      "flex bg-orange-50 text-orange-900 rounded-full px-3 py-1 text-xs font-medium border border-orange-200";

    // Push logs
    results.push({
      name: "Status",
      value: this.progress === 100 ? "Ready" : "Processing",
      className: this.progress === 100 ? badgeReady : badgeProcessing,
      type: "badge",
    });

    if (this.progress < 100) {
      results.push({
        name: "Indexing progress",
        type: "slider",
        progress: this.progress ? this.progress.toFixed(2) : 0,
        value: this.progress.toFixed(2),
      });
    }

    // Return dynamic variables as an array
    return {
      results: results,
    };
  }

  async start() {
    this.running = true;

    let stored = getSettings()[this.slot] || [];
    let researchData;

    while (!researchData) {
      try {
        const response = await fetch(
          "https://beta.dpid.org/api/v2/query/objects"
        );
        const result = await response.json();
        researchData = Array.from(new Set(result.map((d) => d.id)));
      } catch (e) {
        console.error("CODEX plugin failed to fetch ResearchData", e);
        await sleep(1000);
      }
    }

    while (this.running === true && stored.length < researchData.length) {
      if (!stored.length) {
        try {
          const toIndex = researchData[0];
          // Store the first stream to avoid multiple table creation statements
          await global.indexingService.requestStreamIndexing(toIndex, [
            this.slot,
          ]);
          saveResults(this.slot, [toIndex]);
          stored = getSettings()[this.slot] || [];
        } catch (e) {
          console.error("CODEX plugin failed to store the initial stream", e);
          await sleep(1000);
        }

        continue;
      }

      const toIndex = stored
        ? researchData.filter((value) => !stored.includes(value))
        : researchData;

      const promises = await Promise.allSettled(
        toIndex.map((stream_id) =>
          (async () => {
            await global.indexingService.requestStreamIndexing(stream_id, [
              this.slot,
            ]);
            return stream_id;
          })()
        )
      );

      const indexedStreams = promises
        .filter((indexingResult) => indexingResult.status === "fulfilled")
        .map((indexingResult) => indexingResult.value);

      saveResults(this.slot, indexedStreams);

      stored = getSettings()[this.slot] || [];
      this.progress = (stored.length / researchData.length) * 100;
    }

    this.progress = (stored.length / researchData.length) * 100;
  }

  async stop() {
    this.running = false;
  }
}
