import { sleep } from "../utils/helpers.mjs"
import { cliColors } from "../utils/cliColors.mjs"
import { loadAndInitPlugins } from "../utils/plugins.mjs";
import { EventSource  } from "cross-eventsource";
import { StreamID } from "@ceramicnetwork/streamid";
//import { JsonAsString, AggregationDocument } from '@ceramicnetwork/codecs';
import { Type, type, decode } from 'codeco';
import { commitIdAsString } from '@ceramicnetwork/codecs';

/**
 * The indexing service class is responsible for indexing the content stored on the Ceramic node while enabling all of the plugins "installed"
 * on the OrbisDB instance.
 */
export default class IndexingService {
	constructor(ceramic, database, hookHandler, server) {
		console.log(cliColors.text.green, "🔗 Initialized indexing service.", cliColors.reset) ; 
		this.ceramic = ceramic;
		this.database = database;
		this.hookHandler = hookHandler;
		this.server = server;
		this.eventSource = null;

		// Go through the list of all plugins used and enable them
		this.initializePlugins();
	}

	// Map each plugin to the init promise and execute it
	async initializePlugins() {
		// Retrive all plugins installed
		this.plugins = await loadAndInitPlugins();

		// Loads all plugins installed
		const initPromises = this.plugins.map(async (plugin) => {
			this.initPlugin(plugin)
		});

		// Wait for all the initialization promises to resolve
		await Promise.all(initPromises);
		if(this.plugins && this.plugins.length > 0) {
			console.log(cliColors.text.green, "🤖 Initialized ", cliColors.reset, this.plugins.length, cliColors.text.green, " plugin(s).", cliColors.reset);
		} else {
			console.log(cliColors.text.yellow, "There wasn't any plugin to initialize.", cliColors.reset);
		}

		// Trigger the generate hook which can be used to generate new streams automatically
		this.hookHandler.executeHook("generate");
	}

	/** Will init one plugin */
	async initPlugin(plugin) {
		let { HOOKS } = await plugin.init();
		console.log(cliColors.text.cyan, "🤖 Initialized plugin: ", cliColors.reset, plugin.id, cliColors.text.cyan, "for context: ",cliColors.reset, plugin.context);

		// Manage hooks declared by plugins
		if(HOOKS) {
			for(const [hook, handler] of Object.entries(HOOKS)) {
				this.hookHandler.addHookHandler(hook, plugin.id, plugin.context, handler);
			}
		}
	}

	// Will subscribe to the Ceramic node using server side events
	async subscribe() {
		console.log(cliColors.text.cyan, "👀 Subscribed to Ceramic node updates.", cliColors.reset) ; 
		this.eventSource = new EventSource(this.ceramic.node + 'api/v0/feed/aggregation/documents')
		//const Codec = JsonAsString.pipe(AggregationDocument);

		this.eventSource.addEventListener('message', (event) => {
			//use JsonAsString, and AggregationDocument to decode and use event.data
			//const parsedData = decode(Codec, event.data);
			//console.log('parsed', parsedData);
			try {
				const parsedData = decode(Codec, event.data);
				this.indexStream({ stream: parsedData });
			} catch(e) {
				console.log(cliColors.text.red, "Error parsing the Ceramic event:", e, cliColors.reset);
			}
		})
		
		this.eventSource.addEventListener('error', error => {
			console.log('error', error)
		})
	}

	// Triggered after a new plugin install
	async resetPlugins() {
		console.log(cliColors.text.cyan, "🤖 Resetting all plugins.", cliColors.reset);

		// Loop through all plugins instances and stop them
		this.plugins.map(async (plugin) => {
			if(plugin.stop) {
				await plugin.stop();
			}
		});

		// Restart plugins
		this.initializePlugins();
	}

	// Implement the stop method
    async stop() {
		// Loop through all plugins instances and stop them
		this.plugins.map(async (plugin) => {
			if(plugin.stop) {
				await plugin.stop();
			}
		});

        // Close the EventSource if it exists
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
            console.log(cliColors.text.cyan, "🛑 Unsubscribed from Ceramic node updates.", cliColors.reset);
        }

        // Might add additional cleanup logic (if necessary) for example, releasing database connections, resetting internal state, etc.
        console.log(cliColors.text.green, "Indexing service stopped successfully.", cliColors.reset);
    }

	/** Will load the stream details using Ceramic, process the plugins and save the stream in DB */
  	async indexStream({ stream, model }) {
		if(!stream) {
			console.log(cliColors.text.red, "Error indexing a new stream:", cliColors.reset, " stream details are needed to index a stream.");
			return;
		}

		// Trying to retrieve the StreamID from CommitID
		let streamId;
		try {
			streamId = stream.commitId.baseID?.toString();
			console.log(cliColors.text.cyan, "👀 Discovered new stream:", cliColors.reset, streamId);
		} catch(e) {
			return console.log(cliColors.text.red, "Error retrieving the StreamID for this stream:", cliColors.reset, e);;
		}

		try {
			// Get model
			let modelId = new StreamID(stream.metadata.model._type, stream.metadata.model._cid['/']);
			let model = modelId.toString();

			// Get context
			let context;
			let contextId;
			if(stream.metadata.context) {
				context = new StreamID(stream.metadata.context._type, stream.metadata.context._cid['/']);
				contextId = context.toString();
			}			

			// Get controller
			let controller = stream.metadata.controller ? stream.metadata.controller : stream.metadata.controllers[0];

			// Data ingested by the plugin
			let processedData = {
				stream_id: streamId,
				model: model,
				controller: controller,
				content: stream.content
			};

			if (stream) {
				// Will execute all of the validator hooks and terminate if one of them reject the stream
				const { isValid } = await this.hookHandler.executeHook("validate", processedData, contextId);
				if(isValid == false) {
					return console.log(cliColors.text.gray, "Stream is not valid, don't index:", cliColors.reset, streamId);
				}

				// Will execute all of the "metadata" plugins and return a pluginsData object which will contain all of the metadata added by the different plugins
				const { pluginsData } = await this.hookHandler.executeHook("add_metadata", processedData, contextId);

				// Add additional fields to the content which will be saved in the database
				let content = {
					stream_id: streamId,
					controller: controller,
					...stream.content,
					_metadata_context: contextId
				}

				// Save the stream content and indexing data in the specified database
				await this.database.insert(model, content, pluginsData);

				// Will execute all of the post-processor plugins.
				this.hookHandler.executeHook("post_process", processedData, contextId);
	    }
		} catch(e) {
			console.log(cliColors.text.red, "Error indexing stream:", cliColors.reset, e);
		}
    }
}

export const JsonAsString = new Type('JSON-as-string', (_input) => true, (input, context) => {
    try {
        return context.success(JSON.parse(input));
    }
    catch {
        return context.failure();
    }
}, (commitID) => JSON.stringify(commitID));
export const AggregationDocument = type({
    commitId: commitIdAsString,
});
//# sourceMappingURL=feed.js.map
const Codec = JsonAsString.pipe(AggregationDocument)
