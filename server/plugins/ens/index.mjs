import { ethers } from "ethers";

export default class ENSPlugin {
  /**
   * This will initialize all of the hooks used by this plugin.
   * A plugin can register multiple hooks, each hook being linked to a function that will be executed when the hook is triggered
   */
  async init() {
    this.provider = new ethers.JsonRpcProvider(this.rpc_url);

    return {
      HOOKS: {
        "add_metadata": (stream) => this.add_metadata(stream),
      }
    };
  }

  async add_metadata(stream) {
    console.log("In add_metadata this.only_model:", this.only_model);
    console.log("In add_metadata this.model:", this.model_id);
    console.log("In add_metadata stream.model:", stream.model);

    if(this.only_model == "no" || (this.only_model == "yes" && stream.model == this.model_id)) {
      let field;

      /** Will convert the field to the actual value and make an exception for controller to use the address instead of the full did */
      if(this.field == "controller") {
        let { address } = getAddressFromDid(stream.controller);
        field = address;
      } else {
        field = this.getValueByPath(stream, this.field);
      }
      
      console.log("field:", field)
      if(field) {
        switch(this.action) {
          // Will converrt an ENS name to an address
          case "name_to_address":
            const address = await this.getAddress(field);
            console.log("address is: ", address );
            return {
              address: address
            };
          
            // Will convert an address to an ENS name
          case "address_to_name":
            const ensName = await this.getName(field);
            console.log("ensName is: ", ensName);
            return {
              ensName: ensName
            };
          default :
            return null;
        }
      } else {
        return {
          error: "Couldn't retrieve the correct field with " + this.field
        };
      }
    } else {
      console.log("ENS Plugin shouldn't be used on this model.");
    }    
  }

  /** Will convert an ens name into an address */
  async getName(address) {
    try {
      const ensName = await this.provider.lookupAddress(address);
      console.log("ensName is: ", ensName);
      return ensName;
    } catch(e) {
      console.log("Error retrieving ens name:", e);
      return null;
    }
  }

  /** Will convert an address into an ens name */
  async getAddress(ensName) {
    try {
      const address = await this.provider.resolveName(ensName);
      console.log("address is: ", address);
      return address;
    } catch(e) {
      console.log("Error retrieving address:", e);
      return null;
    }
  }

  /** This will convert the path entered by the user into the actual stream key value */
  getValueByPath(obj, path) {
    // Split the path by '.' to get individual keys
    const keys = path.split('.');
    // Reduce the keys to access the nested property
    const result = keys.reduce((currentObject, key) => {
        // Check if the current level is valid to avoid errors
        if (currentObject && currentObject.hasOwnProperty(key)) {
            return currentObject[key];
        }
        // Return undefined or any fallback value if the path is invalid
        return undefined;
    }, obj);
    return result;
  }
  
}

/** Returns a JSON object with the address and network based on the did */
function getAddressFromDid(did) {
  if(did) {
    let didParts = did.split(":");
    if(did.substring(0, 7) == "did:pkh") {
      /** Explode address to retrieve did */
      if(didParts.length >= 4) {
        let address = didParts[4];
        let network = didParts[2];
        let chain = didParts[2] + ":" + didParts[3];

        /** Return result */
        return {
          address: address,
          network: network,
          chain: chain
        }
      } else {
        /** Return null object */
        return {
          address: null,
          network: null,
          chain: null
        }
      }
    } else if(did.substring(0, 7) == "did:key") {
      /** Return did object */
      return {
        address: didParts[3],
        network: 'key',
        chain: 'key'
      }
    } else {
      /** Return null object */
      return {
        address: null,
        network: null,
        chain: null
      }
    }
  } else {
    /** Return null object */
    return {
      address: null,
      network: null,
      chain: null
    }
  }
}