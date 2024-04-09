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
        "validate": (stream) => this.isValid(stream),
        "add_metadata": (stream) => this.add_metadata(stream),
      },
      ROUTES: {
        GET: {
          "hello": this.helloApi,
          "hello-html": this.helloHtmlApi,
        }
      }
    };
  }

  async add_metadata(stream) {
    console.log("In add_metadata stream:", stream);
    console.log("In add_metadata field:", this.field);
    let field = this.getValueByPath(stream, this.field);
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
