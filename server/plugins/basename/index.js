import { ethers } from "ethers";
import logger from "../../logger/index.js";
import { getValueByPath } from "../../utils/helpers.js";
import { getName, getAddress } from "@coinbase/onchainkit/identity";
import { base } from "viem/chains";

export default class BaseIdentityPlugin {
  /**
   * This will initialize all of the hooks used by this plugin.
   * A plugin can register multiple hooks, each hook being linked to a function that will be executed when the hook is triggered
   */
  async init() {
    this.provider = new ethers.JsonRpcProvider(this.rpc_url);
    this.getName("0x83593d13fec30806c989410f9325Fd18245b246B");
    return {
      HOOKS: {
        add_metadata: (stream) => this.add_metadata(stream),
      },
    };
  }

  async add_metadata(stream) {
    logger.debug("In add_metadata this.only_model:", this.only_model);
    logger.debug("In add_metadata this.model:", this.model_id);
    logger.debug("In add_metadata stream.model:", stream.model);

    if (
      this.only_model == "no" ||
      (this.only_model == "yes" && stream.model == this.model_id)
    ) {
      let field;

      /** Will convert the field to the actual value and make an exception for controller to use the address instead of the full did */
      if (this.field == "controller") {
        let { address } = getAddressFromDid(stream.controller);
        field = address;
      } else {
        field = getValueByPath(stream, this.field);
      }

      logger.debug("field:", field);
      if (field) {
        switch (this.action) {
          // Will convert a Base name to an address
          case "name_to_address":
            const address = await this.getAddress(field);
            logger.debug("address is: ", address);
            return {
              address: address,
            };

          // Will convert an address to a Base name
          case "address_to_name":
            const name = await this.getName(field);
            logger.debug("name is: ", name);
            return {
              name: name,
            };
          default:
            return null;
        }
      } else {
        return {
          error: "Couldn't retrieve the correct field with " + this.field,
        };
      }
    } else {
      logger.debug("Base Identity Plugin shouldn't be used on this model.");
    }
  }

  /** Will convert a Base name into an address */
  async getName(address) {
    console.log("Enter getName in BaseIdentity:", address);
    try {
      const name = await getName({ address, chain: base });
      console.log("Base name is: ", name);
      return name;
    } catch (e) {
      console.log("Error retrieving Base identity:", e);
      return null;
    }
  }

  /** Will convert an address into a Base name */
  async getAddress(name) {
    console.log("Enter getAddress in BaseIdentity:", name);
    try {
      const address = await getAddress({ name: name, chain: base });
      console.log("address is: ", address);
      return address;
    } catch (e) {
      console.log("Error retrieving address:", e);
      return null;
    }
  }
}

/** Returns a JSON object with the address and network based on the did */
function getAddressFromDid(did) {
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
