import logger from "../../logger/index.js";
import { getValueByPath } from "../../utils/helpers.js";

export default class GitcoinPassportPlugin {
  /**
   * This will initialize all of the hooks used by this plugin.
   * A plugin can register multiple hooks, each hook being linked to a function that will be executed when the hook is triggered
   */
  async init() {
    let HOOKS = {};
    switch (this.action) {
      case "validate":
        HOOKS.validate = (stream) => this.isValid(stream);
        break;
      case "add_metadata":
        HOOKS.add_metadata = (stream) => this.getScore(stream);
        break;
    }

    return {
      HOOKS: HOOKS,
    };
  }

  /** Will check if user has a sufficient Gitcoin Passport score to use this app */
  async isValid(stream) {
    // Get address and network from did
    let field;

    /** Will convert the field to the actual value and make an exception for controller to use the address instead of the full did */
    if (this.field == "controller") {
      let { address } = getAddressFromDid(stream.controller);
      field = address;
    } else {
      field = getValueByPath(stream, this.field);
    }

    logger.debug("address to use:", field);

    if (field) {
      let score = await this.computeScore(field);
      /** Make sure the user's score is above the minimum score required by the developer */
      if (score > this.min_score) {
        return true;
      } else {
        return false;
      }
    } else {
      logger.debug(
        "Stream " + stream.stream_id + " rejected by Gitcoin Passport."
      );
      return false;
    }
  }

  /** Returns a simple hello:world key value pair which will be added to the plugins_data field */
  async getScore(stream) {
    let score;
    // Get address and network from did
    let field;

    /** Will convert the field to the actual value and make an exception for controller to use the address instead of the full did */
    if (this.field == "controller") {
      let { address } = getAddressFromDid(stream.controller);
      field = address;
    } else {
      field = getValueByPath(stream, this.field);
    }

    if (field) {
      score = await this.computeScore(field);
    }

    return {
      score: score,
    };
  }

  async computeScore(address) {
    let score;
    try {
      /** Will submit passport to make sure we retrieve the latest score */
      let res = await this.submitPassport(address);
      logger.debug("res:", res);

      // Check if passport was already submitted recently
      let isRecent = isTimestampRecent(res.last_score_timestamp);

      if (isRecent && res.status == "DONE") {
        // Passport was already submitted recently so we use the latest score
        score = Number(res.score);
      } else {
        /** Wait for Passport to process the submission and then retrieve the passport score */
        await sleep(3000);

        /** Retrieve passport score */
        let passportScore = await this.getPassportScore(address);
        score = Number(passportScore.score);
      }
    } catch (e) {
      score = undefined;
    }
    logger.debug("score:", score);
    return score;
  }

  /** Submit passport to API to make sure we are using the latest score */
  async submitPassport(address) {
    let passport_details;
    /** Submit passport to generate a score */
    try {
      let res = await fetch(
        "https://api.scorer.gitcoin.co/registry/submit-passport",
        {
          method: "POST",
          body: JSON.stringify({
            address: address,
            scorer_id: this.scorer_id,
          }),
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": this.api_key,
          },
        }
      );
      passport_details = await res.json();
    } catch (e) {
      logger.error("Error submitting passport for this scorer: ", e);
    }
    return passport_details;
  }

  /** Retrieve passport score */
  async getPassportScore(address) {
    let res_score_details;
    try {
      let res_score = await fetch(
        "https://api.scorer.gitcoin.co/registry/score/" +
          this.scorer_id +
          "/" +
          address,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": this.api_key,
          },
        }
      );
      res_score_details = await res_score.json();
    } catch (e) {
      logger.error("Error retrieving passport score for this scorer: ", e);
    }

    return res_score_details;
  }
}

/** HELPERS **/

/** Will check if the passport was submitted recently or not */
function isTimestampRecent(timestampStr) {
  try {
    // Extracting the timestamp from the response and removing the timezone part.
    // This creates a consistent ISO-8601 format that JavaScript can understand.
    const dateTimePart = timestampStr.split("+")[0]; // '2023-10-20T08:18:56.915704'

    // Adding 'Z' to indicate UTC time zone, ensuring it's treated as UTC regardless of the system's local time zone.
    const utcTimestamp = `${dateTimePart}Z`;

    // Parsing the adjusted timestamp string and converting it to a Date object.
    const timestamp = new Date(utcTimestamp);

    // Getting the current time.
    const currentTime = new Date();

    // Calculating the time difference in milliseconds.
    const timeDifference = currentTime.getTime() - timestamp.getTime();
    logger.debug("timeDifference:", timeDifference);

    // Checking if the time difference is less than 1 hour (3600000 milliseconds).
    const isRecent = timeDifference < 3600000;

    return isRecent;
  } catch (error) {
    logger.error("An error occurred while processing the timestamp:", error);
    return false; // You can handle the error as appropriate for your case.
  }
}

/** Returns a JSON object with the address and network based on the did */
export function getAddressFromDid(did) {
  if (did) {
    let didParts = did.split(":");
    if (did.substring(0, 7) == "did:pkh") {
      /** Explode address to retrieve did */
      if (didParts.length >= 4) {
        let address = didParts[4];
        let network = didParts[2];
        let chain = didParts[2] + ":" + didParts[3];

        /** Return result */
        return {
          address: address,
          network: network,
          chain: chain,
        };
      } else {
        /** Return null object */
        return {
          address: null,
          network: null,
          chain: null,
        };
      }
    } else if (did.substring(0, 7) == "did:key") {
      /** Return did object */
      return {
        address: didParts[3],
        network: "key",
        chain: "key",
      };
    } else {
      /** Return null object */
      return {
        address: null,
        network: null,
        chain: null,
      };
    }
  } else {
    /** Return null object */
    return {
      address: null,
      network: null,
      chain: null,
    };
  }
}

/** Wait for x ms in an async function */
export const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
