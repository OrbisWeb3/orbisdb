import { sleep, getCeramicFromNetwork, getTopicFromNetwork } from "../utils/helpers.mjs"
import { loadAndInitPlugins } from "../utils/plugins.mjs";

/**
 * The indexing service class would be responsible for indexing the content while going through all of the plugins "installed"
 * through the orbisDB instance.
 */
export default class IndexingService {
	constructor(network, database, hookHandler, server) {
		console.log("Initialized new IndexingService class for " + network);
		this.ceramic = getCeramicFromNetwork(network);
		this.topic = getTopicFromNetwork(network);
		this.database = database;
		this.hookHandler = hookHandler;
		this.server = server;

		// Go through the list of all plugins used and enable them
		this.initialize();

		// Test adding custom route
		this.server.get('/custom-route', (req, res) => {
	    res.send('This is a custom route');
	  });
	}

	// Map each plugin to an init promise
	async initialize() {
		// Retrive all plugins installed
		let plugins = await loadAndInitPlugins();

		// Loads all plugins installed
    const initPromises = plugins.map(async (plugin) => {
      let { HOOKS, ROUTES } = await plugin.init();
			console.log("ROUTES for " + plugin.id + ":", ROUTES);
      console.log("Initialized plugin: " + plugin.id + " for context:" + plugin.context);

			// Manage hooks declared by plugins
      if(HOOKS) {
        for (const [hook, handler] of Object.entries(HOOKS)) {
          this.hookHandler.addHookHandler(hook, plugin.id, plugin.context, handler);
        }
      }

			// Register API routes requested by this plugin
			if (ROUTES) {
				// Handle GET routes
				if(ROUTES.GET) {
					for (const [route, method] of Object.entries(ROUTES.GET)) {
						let api_route = `/api/plugins/:plugin_id/:context_id/${route}`;
						console.log("Registering GET route:", api_route);
						this.server.get(api_route, (req, res) => {
							method(req, res);
						});
					}
				}

				// Handle POST routes
				if(ROUTES.POST) {
					for (const [route, method] of Object.entries(ROUTES.POST)) {
						let api_route = `/api/plugins/:plugin_id/:context_id/${route}`;
						console.log("Registering POST route:", api_route);
						this.server.post(api_route, (req, res) => {
							method(req, res);
						});
					}
				}
			}
    });

    // Wait for all the initialization promises to resolve
    await Promise.all(initPromises);

    console.log("All plugins are initialized");

		// Trigger the generate hook which can be used to generate new streams automatically
		this.hookHandler.executeHook("generate");
	}

	// Will subscribe to the IPFS pubsub topic specified in the constructor
	async subscribe() {
		// in reality it'd be a ceramic listener, not a loop
    while (true) {
      await sleep(2500);
      const stream = (fakeStreams.length && fakeStreams.pop()) || false;
      if (stream) {
        this.indexStream(stream);
      }
    }

		/*try {
			//await ipfs.pubsub.subscribe(this.topic, this.parsePubsubMsg);
		} catch(e) {
			console.log("Error subscribing to the IPFS pubsub topic:", this.topic);
		}*/
	}

	// Will parse the message received via the pubsub topic
	parsePubsubMsg(msg) {
		let data = new TextDecoderLite().decode(msg.data);
		const parsed = JSON.parse(data);
		switch (parsed.typ) {
			/** Type 0 are the only type of write and update */
			case 0:
				console.log("parsed: ", parsed);
				this.indexStream(parsed.model, parsed.stream);
				break;
			default:
		}
	}

	/** Will load the stream details using Ceramic, process the plugins and save the stream in DB */
  	async indexStream({ streamId, model }) {
		console.log("Enter indexStream with: ", streamId);

		try {
			// Load the stream details from Ceramic
			let stream = await this.ceramic.loadStream(streamId);

			// Data ingested by the plugin
			let processedData = {
				stream_id: streamId,
				model: model,
				controller: stream.metadata.controller ? stream.metadata.controller : stream.metadata.controllers[0],
				content: stream.content
			};

			// Retrieve context id for identified stream
			let contextId = stream.content.context;

			if (stream) {
				// Will execute all of the validator hooks and terminate if one of them reject the stream
				const { isValid } = await this.hookHandler.executeHook("validate", processedData, contextId);
				console.log("Is stream valid? ", isValid);
				if(isValid == false) {
					return console.log("This stream is not valid, don't index:", streamId);
				}

				// Will execute all of the "metadata" plugins and return a pluginsData object which will contain all of the metadata added by the different plugins
				const { pluginsData } = await this.hookHandler.executeHook("add_metadata", processedData, contextId);

				// Add additional fields to the content which will be saved in the database
				let content = {
					stream_id: streamId,
					controller: stream.metadata.controller ? stream.metadata.controller : stream.metadata.controllers[0],
					...stream.content
				}

				// Save the stream content and indexing data in the specified database
				await this.database.insert(model, content, pluginsData);

				// Will execute all of the post-processor plugins.
				this.hookHandler.executeHook("post_process", processedData, contextId);
	    }
		} catch(e) {
			console.log("Error indexing stream:", e);
		}
    }
}

const fakeStreams = [
  {
    streamId: "kjzl6kcym7w8yazsd0ik5iixpojm1p3piefa4dv5gul6qhzxzy9i7qs8j7jqvfh",
    model: "kjzl6hvfrbw6ca079wipwvwgk5dq1epio34hrc48dbm3bd7k8lqjqm55aqjf72a"
  },
  {
    streamId: "kjzl6kcym7w8y5k0gv2ffnzzg7vvvi1ayi7a6rov5nrz4k0zywt854smulwfdin",
    model: "kjzl6hvfrbw6ca079wipwvwgk5dq1epio34hrc48dbm3bd7k8lqjqm55aqjf72a"
  },
  {
    streamId: "k2t6wzhkhabz5i8k99qxvxs9bhe9zdekc9wd56ymoqpqeziloa030luut9h7r8",
    model: "kjzl6hvfrbw6cb8b9j326870su0gmlziwepl5nu8jk9tybwxe7mobm67cqd58a3"
  },
{
	streamId: "kjzl6kcym7w8y56rpeh47hb3t5fshp9b7geqv7197gbb6sbob6vccp5l7qa1spc",
	model: "kjzl6hvfrbw6c8pzfstttcl1xessjf6wc87k3t2pyz3ibsypfxxjrneh9ioamyb"
}
];
