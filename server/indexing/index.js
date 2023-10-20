import { initIPFS } from '../ipfs/config.js';
import { sleep, getCeramicFromNetwork, getTopicFromNetwork } from "../utils/helpers.js"

/**
 * The indexing service class would be responsible for indexing the content while going through all of the plugins "installed"
 * through the orbisDB instance.
 */
export default class IndexingService {
	constructor(network, plugins = [], database, hookHandler) {
		console.log("Initialized new IndexingService class for " + network);
		this.ceramic = getCeramicFromNetwork(network);
		this.topic = getTopicFromNetwork(network);
		this.plugins = plugins;
		this.database = database;
		this.hookHandler = hookHandler;

		// Go through the list of all plugins used and enable them
		this.plugins.forEach(async (plugin, i) => {
			let { HOOKS } = await plugin.init();
			if(HOOKS) {
	      for (const [hook, handler] of Object.entries(HOOKS)) {
	        this.hookHandler.addHookHandler(hook, plugin.id, handler);
	      }
	    }
		});
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
  async indexStream({streamId, model }) {
		console.log("Enter indexStream with: ", streamId);

		try {
			// Load the stream details from Ceramic
			let stream = await this.ceramic.loadStream(streamId);

			// Data ingested by the plugin
			let processedData = {
				stream_id: streamId,
				model: model,
				controller: stream.metadata.controller,
				content: stream.content
			};

			if (stream) {
				// Will execute all of the validator hooks and terminate if one of them reject the stream
				const { isValid } = await this.hookHandler.executeHook("stream:validate", processedData);
				console.log("Is stream valid? ", isValid);
				if(isValid == false) {
					return console.log("This stream is not valid, don't index:", streamId);
				}

				// Will execute all of the "metadata" plugins and return a pluginsData object which will contain all of the metadata added by the different plugins
				const { pluginsData } = await this.hookHandler.executeHook("stream:add_metadata", processedData);

				// Add additional fields to the content which will be saved in the database
				let content = {
					stream_id: streamId,
					model: model,
					controller: stream.metadata.controller,
					...stream.content
				}

				// Save the stream content and indexing data in the specified database
				await this.database.save(model, content, pluginsData);

				// Finally will execute all of the post-processor plugins.
				this.hookHandler.executeHook("stream:post_process", processedData);
	    }
		} catch(e) {
			console.log("Error indexing stream:", e);
		}

		// Go through all of the pre-processor and validator plugins to process them.
    }
}

const fakeStreams = [
  {
    streamId: "k2t6wzhkhabz67tknkbeexqw1ykb8t89e8eryl4gm3yqoljpryy8yw3aqr1dxs",
    model: "kjzl6hvfrbw6cb8b9j326870su0gmlziwepl5nu8jk9tybwxe7mobm67cqd58a3",
  },
  {
    streamId: "k2t6wzhkhabz0s4vdakn4fozuitrenqs79s68czilgzpa4m0nmnt52nyvhi3gj",
    model: "kjzl6hvfrbw6cb8b9j326870su0gmlziwepl5nu8jk9tybwxe7mobm67cqd58a3",
  },
  {
    streamId: "kjzl6kcym7w8y6uep0dkyoxyt8fw414or0qgnlmj06u84taorz8vjtis0tyf4fb",
    model: "kjzl6hvfrbw6c5be464ta8ne35crfj4dbmxirtjrrdbhzmjvf9hlqtulfc2z7de",
  },
  {
    streamId: "k2t6wzhkhabz51k2e3edqueb92fbs98qc3ks4fjvzfz00ky6nyc37n6bbwoo0y",
    model: "kjzl6hvfrbw6cb8b9j326870su0gmlziwepl5nu8jk9tybwxe7mobm67cqd58a3",
  },
  {
    streamId: "kjzl6kcym7w8y8ma22529ce1xv9wonufjeqrxygt6oiz8yz2792kyqo8qhbz3dt",
    model: "kjzl6hvfrbw6c5be464ta8ne35crfj4dbmxirtjrrdbhzmjvf9hlqtulfc2z7de",
  },

  {
    streamId: "k2t6wzhkhabz5i8k99qxvxs9bhe9zdekc9wd56ymoqpqeziloa030luut9h7r8",
    model: "kjzl6hvfrbw6cb8b9j326870su0gmlziwepl5nu8jk9tybwxe7mobm67cqd58a3",
  },
];
