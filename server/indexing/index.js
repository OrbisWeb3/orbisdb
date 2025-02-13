import { findSlotsWithContext } from "../utils/helpers.js";
import { cliColors } from "../utils/cliColors.js";
import { loadAndInitPlugins } from "../utils/plugins.js";
import { EventSource } from "cross-eventsource";
import { Type, type, decode } from "codeco";
import { commitIdAsString } from "@ceramicnetwork/codecs";
import { ModelInstanceDocument } from "@ceramicnetwork/stream-model-instance";
import logger from "../logger/index.js";

/**
 * The indexing service class is responsible for indexing the content stored on the Ceramic node while enabling all of the plugins "installed"
 * on the OrbisDB instance.
 */
export default class IndexingService {
  constructor(
    globalCeramic,
    globalDatabase,
    ceramics,
    databases,
    hookHandler,
    server,
    is_shared
  ) {
    logger.info(
      cliColors.text.cyan,
      "🔗 Initialized indexing service.",
      cliColors.reset
    );
    this.ceramic = globalCeramic;
    this.database = globalDatabase;
    this.ceramics = ceramics;
    this.databases = databases;
    this.hookHandler = hookHandler;
    this.server = server;
    this.eventSource = null;
    this.is_shared = is_shared;

    // Go through the list of all plugins used and enable them
    this.initializePlugins();
  }

  // Map each plugin to the init promise and execute it
  async initializePlugins() {
    // Retrieve all plugins installed
    this.plugins = await loadAndInitPlugins();

    // Loads all plugins installed
    const initPromises = this.plugins.map(async (plugin) => {
      this.initPlugin(plugin);
    });

    // Wait for all the initialization promises to resolve
    await Promise.all(initPromises);
    if (this.plugins && this.plugins.length > 0) {
      logger.info(
        cliColors.text.green,
        "🤖 Initialized ",
        cliColors.reset,
        this.plugins.length,
        cliColors.text.green,
        " plugin(s).",
        cliColors.reset
      );
    } else {
      logger.info(
        cliColors.text.yellow,
        "🤖 There wasn't any plugin to initialize.",
        cliColors.reset
      );
    }

    // Trigger the generate hook which can be used to generate new streams automatically
    this.hookHandler.executeHook("generate");
  }

  /** Will init one plugin */
  async initPlugin(plugin) {
    let { HOOKS } = await plugin.init();

    logger.debug(
      cliColors.text.cyan,
      "🤖 Initialized plugin: ",
      cliColors.reset,
      plugin.id,
      cliColors.text.cyan,
      "for context: ",
      cliColors.reset,
      plugin.context
    );

    // Manage hooks declared by plugins
    if (HOOKS) {
      for (const [hook, handler] of Object.entries(HOOKS)) {
        this.hookHandler.addHookHandler(
          hook,
          plugin.id,
          plugin.uuid,
          plugin.context,
          handler
        );
      }
    }
  }

  // Will subscribe to the Ceramic node using server side events
  async subscribe() {
    logger.info(
      cliColors.text.cyan,
      "👀 Subscribed to Ceramic node updates: ",
      cliColors.reset,
      this.ceramic.node
    );
    this.eventSource = new EventSource(
      this.ceramic.node + "api/v0/feed/aggregation/documents"
    );

    this.eventSource.addEventListener("message", (event) => {
      try {
        const parsedData = decode(Codec, event.data);

        // Perform different action based on eventType
        switch (parsedData.eventType) {
          // Discoverd a new stream
          case 0:
            console.log(
              cliColors.text.cyan,
              "👀 Discovered new stream:",
              cliColors.reset,
              parsedData.commitId.baseID?.toString()
            );
            this.indexStream({ stream: parsedData });
            break;
          // Updated a new stream
          case 1:
            console.log(
              cliColors.text.cyan,
              "👀 Update discovered for stream:",
              cliColors.reset,
              parsedData.commitId.baseID?.toString()
            );
            this.indexStream({ stream: parsedData });
            break;
          // Detect anchoring
          case 2:
            console.log(
              cliColors.text.cyan,
              "👀 Detected anchoring for stream:",
              cliColors.reset,
              parsedData.commitId.baseID?.toString()
            );
            break;
        }
      } catch (e) {
        logger.error(
          cliColors.text.red,
          "Error parsing the Ceramic event:",
          e,
          cliColors.reset
        );
      }
    });

    this.eventSource.addEventListener("error", (error) => {
      logger.error(
        cliColors.text.red,
        "🛑 Error received from Ceramic node (double check your settings and that your Ceramic node is alive): ",
        cliColors.reset,
        error
      );
    });
  }

  // Triggered after a new plugin install
  async restartPlugins(pluginToReset) {
    logger.info(
      cliColors.text.cyan,
      "🤖 Resetting all plugins.",
      cliColors.reset
    );

    // Loop through all plugins instances and stop them
    this.plugins.map(async (plugin) => {
      /** Stop plugins */
      if (plugin?.stop) {
        try {
          await plugin.stop();
        } catch (e) {
          console.log("Error stopping plugin:", e);
        }
      }

      /** Reset the specified plugin's settings */
      if (pluginToReset && plugin?.uuid == pluginToReset && plugin?.reset) {
        try {
          await plugin.reset();
        } catch (e) {
          console.log("Error resetting plugin:", e);
        }
      }
    });

    // Restart plugins
    this.initializePlugins();
  }

  // Implement the stop method
  async stop() {
    // Loop through all plugins instances and stop them
    this.plugins.map(async (plugin) => {
      if (plugin?.stop) {
        try {
          await plugin.stop();
        } catch (e) {
          console.log("Error stopping plugin:", e);
        }
      }
    });

    // Close the EventSource if it exists
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      logger.debug(
        cliColors.text.cyan,
        "🛑 Unsubscribed from Ceramic node updates.",
        cliColors.reset
      );
    }

    // Might add additional cleanup logic (if necessary) for example, releasing database connections, resetting internal state, etc.
    console.log(
      cliColors.text.green,
      "Indexing service stopped successfully.",
      cliColors.reset
    );
  }

  async requestStreamIndexing(stream_id, slots = []) {
    const stream = await ModelInstanceDocument.load(
      this.ceramic.client,
      stream_id
    );

    return this.indexStream({ stream }, slots);
  }

  /** Will parse the stream details, process the plugins and save the stream in DB */
  async indexStream({ stream }, requestingSlots = []) {
    if (!stream) {
      logger.error(
        cliColors.text.red,
        "Error indexing a new stream:",
        cliColors.reset,
        " stream details are needed to index a stream."
      );
      return;
    }

    // Trying to retrieve the StreamID from CommitID
    let streamId;
    try {
      streamId = stream.commitId.baseID?.toString();
    } catch (e) {
      return logger.error(
        cliColors.text.red,
        "Error retrieving the StreamID for this stream:",
        cliColors.reset,
        e
      );
    }

    try {
      // Get content
      let content =
        typeof stream.content === "object"
          ? stream.content
          : JSON.parse(stream.content);

      // Get model
      let model = stream.metadata.model;

      // Get context
      let context = stream.metadata.context;

      // Get controller
      let controller = stream.metadata.controller
        ? stream.metadata.controller
        : stream.metadata.controllers[0];

      // Data ingested by the plugin
      let processedData = {
        stream_id: streamId,
        model: model,
        controller: controller,
        content: content,
      };

      if (stream) {
        // Will execute all of the validator hooks and terminate if one of them reject the stream
        const { isValid } = await this.hookHandler.executeHook(
          "validate",
          processedData,
          context
        );
        if (isValid == false) {
          return logger.debug(
            cliColors.text.red,
            "❌ Stream is not valid, don't index:",
            cliColors.reset,
            streamId
          );
        } else {
          // Will execute all of the "metadata" plugins and return a pluginsData object which will contain all of the metadata added by the different plugins
          const { pluginsData } = await this.hookHandler.executeHook(
            "add_metadata",
            processedData,
            context
          );

          // Add additional fields to the content which will be saved in the database
          let insertedContent = {
            stream_id: streamId,
            controller: controller,
            ...content,
            _metadata_context: context,
          };

          // Perform insert or update based on event type
          // Save the stream content and indexing data in the specified database
          if (this.is_shared) {
            let slots = Array.from(
              new Set([
                ...requestingSlots,
                ...(findSlotsWithContext(context) || []),
              ])
            );

            logger.debug("slots:", slots);

            // Insert in each slot using this context
            for (const slot of slots) {
              if (this.databases[slot]) {
                await this.databases[slot].upsert(
                  model,
                  insertedContent,
                  pluginsData
                );
              } else {
                logger.error(`Upsert method not found for slot: ${slot}`);
              }
            }
          } else {
            await this.database.upsert(model, insertedContent, pluginsData);
          }

          // Will execute all of the post-processor plugins.
          this.hookHandler.executeHook(
            "post_process",
            {
              ...insertedContent,
              model,
              pluginsData,
            },
            context
          );
        }
      }
    } catch (e) {
      logger.error(
        cliColors.text.red,
        "Error indexing stream:",
        cliColors.reset,
        e
      );
    }
  }
}

export const JsonAsString = new Type(
  "JSON-as-string",
  (_input) => true,
  (input, context) => {
    try {
      return context.success(JSON.parse(input));
    } catch {
      return context.failure();
    }
  },
  (commitID) => JSON.stringify(commitID)
);

export const AggregationDocument = type({
  commitId: commitIdAsString,
});
//# sourceMappingURL=feed.js.map
const Codec = JsonAsString.pipe(AggregationDocument);
