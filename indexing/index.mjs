import { initIPFS } from '../ipfs/config.mjs';
import { sleep, getCeramicFromNetwork, getTopicFromNetwork } from "../utils/helpers.mjs"

/**
 * The indexing service class would be responsible for indexing the content while going through all of the plugins "installed"
 * through the orbisDB instance.
 */
export default class IndexingService {
	constructor(network, plugins = [], database) {
		console.log("Initialized new IndexingService class for " + network);
		this.ceramic = getCeramicFromNetwork(network);
		this.topic = getTopicFromNetwork(network);
		this.plugins = plugins;
		this.database = database;
	}

	// Will subscribe to the IPFS pubsub topic specified in the constructor
	async subscribe() {
		try {
			// For demo purposes
			await sleep(2000);
      await this.indexStream(
				"kjzl6hvfrbw6cb8b9j326870su0gmlziwepl5nu8jk9tybwxe7mobm67cqd58a3",
				"k2t6wzhkhabz2suoe70986m3u5su4nut7cki3kb9p3mpmonq9odf5a98z003km"
			);

			//await ipfs.pubsub.subscribe(this.topic, this.parsePubsubMsg);
		} catch(e) {
			console.log("Error subscribing to the IPFS pubsub topic:", this.topic);
		}
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
  async indexStream(model, streamId) {
		console.log("Enter indexStream with: ", streamId);
		// Load the stream details from Ceramic
    let stream = await this.ceramic.loadStream(streamId);

		// Go through all of the pre-processor and validator plugins to process them.
    if (stream) {
      for (const plugin of this.plugins) {
        switch (plugin.type) {
          case 'pre-processor':
            stream.indexingData = await plugin.process(stream);
            break;
          case 'validator':
            const isValid = await plugin.validate(stream);
            if (!isValid) {
              console.log(`Stream isn't valid ${plugin.name}`);
              return;
            }
            break;
        }
      }

			// Add additional fields to the content
			let content = {
				stream_id: streamId,
				model: model,
				controller: stream.metadata.controller,
				...stream.content
			}

			// Save the stream content and indexing data in the specified database
      await this.database.save(model, content, stream.indexingData);

			// Finally go through the post-processor plugins.
      for (const plugin of this.plugins) {
        if (plugin.type === 'post-processor') {
          await plugin.process(stream);
        }
      }
    }
  }
}
