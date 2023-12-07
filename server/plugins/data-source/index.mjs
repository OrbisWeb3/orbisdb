/** Import Ceramic SDK */
import { CeramicClient } from '@ceramicnetwork/http-client';
import { Model } from '@ceramicnetwork/stream-model';
import { ModelInstanceDocument } from "@ceramicnetwork/stream-model-instance";
import { StreamID } from "@ceramicnetwork/streamid";

/** To generate dids from a Seed */
import { DID } from 'dids'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import { getResolver } from 'key-did-resolver'

export default class DataSourcePlugin {
  constructor({ ceramic_seed, model_id, secs_interval = 0, url, keys }) {
    this.ceramic_seed = JSON.parse(ceramic_seed);
    this.model_id = model_id;
    this.secs_interval = secs_interval;
    this.url = url;

    /** Variables to make dynamic */
    try {
      this.keys = JSON.parse(keys);
    } catch(e) {
      console.log("Error parsing keys:", e);
    }


    /** Initialize the Orbis class object */
    this.ceramic = new CeramicClient("https://node2.orbis.club/");
    this.session;
  }

  /**
   * This will initialize all of the hooks used by this plugin.
   * A plugin can register multiple hooks, each hook being linked to a function that will be executed when the hook is triggered
   */
  async init() {
    return {
      HOOKS: {
        "generate": () => this.start(),
      },
    };
  }

  /** Will connect to Ceramic using the seed passed by the plugin settings and trigger the fetch interval */
  async start() {
    try {
      let seed = new Uint8Array(this.ceramic_seed);

      /** Create the provider and resolve it */
  		const provider = new Ed25519Provider(seed);
  		let did = new DID({ provider, resolver: getResolver() })

  		/** Authenticate the Did */
  		await did.authenticate()

  		/** Assign did to Ceramic object  */
  		this.ceramic.did = did;
  		this.session = {
  			did: did,
  			id: did.id
  		};

      console.log("Connected to Ceramic with DID:", did.id);

      /**
      let model_stream = await Model.create(this.ceramic,
        modelDef,
        {
          model: "kh4q0ozorrgaq2mezktnrmdwleo1d",
          controller: this.session.id
        }
      );
      console.log("model_stream:", model_stream?.id?.toString())*/

      // Perform first call
      this.fetchApi();

      // Start the interval function
      this.interval = setInterval(() => {
        this.fetchApi();
      }, this.secs_interval * 1000);

    } catch(e) {
      console.log("Couldn't connect to Ceramic, check the seed again:", e);
    }
  }

  /** This will fetch the API and create a Ceramic stream afterward based on the plugin settings */
  async fetchApi() {
    let results = await this.getResult();

    if(results) {
      for (const result of results) {
        if (result) {
          try {
            let content = {
              ...result,
              context: this.context,
              timestamp: Math.floor(Date.now() / 1000)
            };
            

            /** We call the update hook here in order to support hooks able to update data before it's created in Ceramic  */
				    let __content = await global.indexingService.hookHandler.executeHook("update", content, this.context);
            console.log("content:", __content);

            /** We then create the stream with the updated content */
            let stream = await ModelInstanceDocument.create(
              this.ceramic,
              __content,
              {
                model: StreamID.fromString(this.model_id),
                controller: this.session.id
              }
            );
            let stream_id = stream.id?.toString();

            // Force index stream in db if created on Ceramic
            if(stream_id) {
              console.log("stream created:", stream_id);
              global.indexingService.indexStream({ streamId: stream_id, model: this.model_id });
            }

          } catch (e) {
            console.log("Error creating model stream:", e);
          }
        }
      }
    }
  }


  /** Will return the result expected by the developer using the variables */
  async getResult() {
    let results = [];

    try {
      let res = await fetch(this.url);
      let data = await res.json();

      // Iterate over each document group
      for (const doc of this.keys) {
        let result = {};

        // Iterate over the keys and build the result object for each document
        for (const item of doc.keys) {
          if ('path' in item) {
            // Existing path traversal logic
            let value = data;
            for (const pathSegment of item.path) {
              if (value && value[pathSegment]) {
                value = value[pathSegment];

                /** Convert result to expected type for this key */
                switch (item.type) {
                  case "numeric":
                    result[item.key] = parseFloat(value);
                    break;
                  default:
                    result[item.key] = value.toString();
                }

              } else {
                console.log("value is undefined for: ", item.path);
                result[item.key] = null;
              }
            }

          } else if ('value' in item) {
            // Existing value assignment logic
            result[item.key] = item.value;
          }
        }

        results.push(result);
      }
    } catch(e) {
      console.log("Error fetching URL:" + this.url + ": ", e);
    }

    return results;
  }
}

let modelDef = {
  "name": "PriceFeed",
  "description": "Model storing price feeds for any asset. Version: 1.02",
  "version": "1.0",
  "accountRelation": {
    "type": "list"
  },
  "schema": {
    "type": "object",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "required": [
      "asset",
      "currency"
    ],
    "properties": {
      "asset": {
        "type": "string"
      },
      "price": {
        "type": ["number", "null"]
      },
      "currency": {
        "type": "string"
      },
      "source": {
        "type": "string"
      },
      "candle": {
        "type": "string"
      },
      "timestamp": {
        "type": "integer"
      },
      "context": {
        "type": "string"
      }
    },
    "additionalProperties": false
  }
}

/** To create a model */
/*let stream = await Model.create(this.ceramic,
  modelDef,
  {
    family: "test-db",
    model: "kh4q0ozorrgaq2mezktnrmdwleo1d",
    controller: this.session.id
  }
);*/
