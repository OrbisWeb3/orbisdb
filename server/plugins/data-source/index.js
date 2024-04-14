export default class DataSourcePlugin {
  /**
   * This will initialize all of the hooks used by this plugin.
   * A plugin can register multiple hooks, each hook being linked to a function that will be executed when the hook is triggered
   */
  async init() {
    return {
      HOOKS: {
        generate: () => this.start(),
      },
    };
  }

  /** Will connect to Ceramic using the seed passed by the plugin settings and trigger the fetch interval */
  async start() {
    try {
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
    } catch (e) {
      console.log("Couldn't connect to Ceramic, check the seed again:", e);
    }
  }

  /** Will stop the plugin's interval */
  async stop() {
    console.log("Stopping plugin:", this.uuid);
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null; // Clear the stored interval ID
    }
  }

  /** This will fetch the API and create a Ceramic stream afterward based on the plugin settings */
  async fetchApi() {
    let results = await this.getResult();

    if (results) {
      for (const result of results) {
        if (result) {
          try {
            let content = {
              ...result,
              context: this.context,
              timestamp: Math.floor(Date.now() / 1000),
            };

            /** We call the update hook here in order to support hooks able to update data before it's created in Ceramic  */
            let __content =
              await global.indexingService.hookHandler.executeHook(
                "update",
                content,
                this.context
              );
            console.log("content:", __content);

            /** We then create the stream with the updated content */
            let stream = await global.indexingService.ceramic.orbisdb
              .insert(this.model_id)
              .value(__content)
              .context(this.context)
              .run();

            console.log("Stream created:", stream);
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
      let keys = JSON.parse(this.keys);
      for (const doc of keys) {
        let result = {};

        // Iterate over the keys and build the result object for each document
        for (const item of doc.keys) {
          if ("path" in item) {
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
          } else if ("value" in item) {
            // Existing value assignment logic
            result[item.key] = item.value;
          }
        }

        results.push(result);
      }
    } catch (e) {
      console.log("Error fetching URL:" + this.url + ": ", e);
    }

    return results;
  }
}

let modelDef = {
  name: "PriceFeed",
  description: "Model storing price feeds for any asset. Version: 1.02",
  version: "1.0",
  accountRelation: {
    type: "list",
  },
  schema: {
    type: "object",
    $schema: "https://json-schema.org/draft/2020-12/schema",
    required: ["asset", "currency"],
    properties: {
      asset: {
        type: "string",
      },
      price: {
        type: ["number", "null"],
      },
      currency: {
        type: "string",
      },
      source: {
        type: "string",
      },
      candle: {
        type: "string",
      },
      timestamp: {
        type: "integer",
      },
      context: {
        type: "string",
      },
    },
    additionalProperties: false,
  },
};

/** To create a model */
/*let stream = await Model.create(this.ceramic,
  modelDef,
  {
    family: "test-db",
    model: "kh4q0ozorrgaq2mezktnrmdwleo1d",
    controller: this.session.id
  }
);*/
