import logger from "../../logger/index.js";
import cron from "node-cron";

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

  /** Will create cron job for the process task */
  start() {
    if (this.cron_interval) {
      this.task = cron.schedule(this.cron_interval, () => {
        this.fetchApi();
        console.log("Running the process task every:", this.cron_interval);
      });
    }
  }

  /** Will make sure cron job is stopped if OrbisDB is restarted */
  async stop() {
    logger.debug("Stopping plugin:", this.uuid);
    this.task.stop();
  }

  /** This will fetch the API and create a Ceramic stream afterward based on the plugin settings */
  async fetchApi() {
    let results = await this.getResult();
    console.log("results:", results);

    if (results) {
      for (const result of results) {
        console.log("result:", result);
        if (result) {
          try {
            /** We then create the stream with the updated content */
            let stream = await global.indexingService.ceramic.orbisdb
              .insert(this.model_id)
              .value(result)
              .context(this.context)
              .run();

            logger.debug("Stream created:", stream);
          } catch (e) {
            logger.error("Error creating model stream:", e);
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
          console.log("item:", item);
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
                logger.debug("value is undefined for: ", item.path);
                result[item.key] = null;
              }
            }
          } else if ("value" in item) {
            // Existing value assignment logic
            result[item.key] = item.value;
          }
        }

        results.push(result);
        console.log("Pushing:", results);
      }
    } catch (e) {
      logger.error("Error fetching URL:" + this.url + ": ", e);
    }

    return results;
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
