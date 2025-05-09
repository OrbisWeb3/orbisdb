import logger from "../../logger/index.js";
import { getValueByPath } from "../../utils/helpers.js";

export default class EthereumUnitConverter {
  /**
   * This will initialize all of the hooks used by this plugin.
   * A plugin can register multiple hooks, each hook being linked to a function that will be executed when the hook is triggered
   */
  async init() {
    return {
      HOOKS: {
        add_metadata: (stream) => this.convert(stream),
      },
    };
  }

  /** Returns a simple hello:world key value pair which will be added to the plugins_data field */
  async convert(stream) {
    if (
      this.only_model == "no" ||
      (this.only_model == "yes" && stream.model == this.model_id)
    ) {
      // Get field value
      let fieldVal = getValueByPath(stream, this.field);
      console.log("fieldVal:", fieldVal);

      // Perform conversion
      let value = formatValue(fieldVal, this.decimals);
      console.log("final value:", value);

      let results = {};
      results[this.field] = value;
      return results;
    }
  }
}

/** Will convert the value to the expected decimal */
function formatValue(value, decimals) {
  if (decimals === undefined) {
    console.error("Decimals not loaded");
    return value?.toString();
  }

  const divisor = Math.pow(10, decimals);
  return (parseFloat(value) / divisor).toFixed(decimals);
}
