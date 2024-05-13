import { ethers } from "ethers";
import { erc20_abi, erc721_abi, erc1155_abi } from "./abis.js";
import logger from "../../logger/index.js";

export default class TokenGatingPlugin {
  /**
   * This will initialize all of the hooks used by this plugin.
   * A plugin can register multiple hooks, each hook being linked to a function that will be executed when the hook is triggered
   */
  async init() {
    this.setConfig();
    this.testStream();
    return {
      HOOKS: {
        validate: (stream) => this.isValid(stream),
      },
      ROUTES: {
        GET: {
          check: (req, res) => this.checkOwnershipApi(req, res),
        },
      },
    };
  }

  async setConfig() {
    /** Select correct provider based on the RPC URL added by the user */
    logger.debug("this.rpc_url:", this.rpc_url);
    this.provider = new ethers.getDefaultProvider(this.rpc_url);
  }

  async testStream() {
    try {
      let stream = await global.indexingService.ceramic.orbisdb
        .insert(
          "kjzl6hvfrbw6c643jhjfwa58rtre6x9zp3dl7bez7nvvocgwgua779euqovvidk"
        )
        .value({
          title: "hey title",
          author: "hey author",
          description: "hey description",
        })
        .context(this.context)
        .run();
    } catch (e) {
      logger.error(
        "Error creating stream with model:" + this.model_id + ":",
        e
      );
    }
  }

  /** Will mark al of the streams as valid */
  async isValid(stream) {
    // Get address and network from did
    let { address } = getAddressFromDid(stream.controller);
    if (address) {
      let hasAccess = false;
      let userBalance = await this.getBalance(address);
      if (userBalance && userBalance >= this.min_balance) {
        hasAccess = true;
      }

      return hasAccess;
    } else {
      return false;
    }
  }

  /** Example of an API route returning a simple json object. The routes declared by a plugin are automatically exposed by the OrbisDB instance */
  async checkOwnershipApi(req, res) {
    //const { address } = req.params;
    const address = "0x075286D1a22B083ebCAF6B7Fb4CF970cFC4A18F0";

    if (!address) {
      return res.badRequest("No valid address provided.");
    }

    const userBalance = await this.getBalance(address);

    if (userBalance && userBalance >= this.min_balance) {
      return {
        hasAccess: true,
        address,
        userBalance,
      };
    }

    return {
      hasAccess: false,
      address,
      balance,
    };
  }

  /** Will check a user's balance for a specific contract */
  async getBalance(account) {
    let contract;
    let contractAbi;
    let isContractValid = false;
    let isAddressValid = false;
    let balance = 0;

    /** Select the right ABI based on contract type */
    switch (this.contract_type) {
      case "erc20":
        contractAbi = erc20_abi;
        break;
      case "erc721":
        contractAbi = erc721_abi;
        break;
      case "erc1155":
        contractAbi = erc1155_abi;
        break;
      default:
        logger.error("Invalid contract type: ", this.contract_type);
        return 0;
    }

    /** Check if contract address is valid using ethers.js */
    if (ethers.isAddress(this.contract_address)) {
      isAddressValid = true;
    } else {
      logger.error("Address is not valid:", this.contract_address);
      return 0;
    }

    /** Create contract object using ethers.js */
    try {
      contract = new ethers.Contract(
        this.contract_address,
        contractAbi,
        this.provider
      );
      isContractValid = true;
    } catch (e) {
      logger.error("Error creating contract:", e);
      return 0;
    }

    if (isContractValid && isAddressValid) {
      /** Retrieve balance for ERC20 and ERC721 */
      try {
        if (this.contract_type == "erc20" || this.contract_type == "erc721") {
          balance = await contract.balanceOf(account);

          /** Apply decimals if ERC20 */
          if (this.contract_type == "erc20" && this.decimals) {
            balance = ethers.utils.formatUnits(balance, this.decimals);
          }
        } else if (this.contract_type == "erc1155") {
          /** Use token_id variable if ERC1155 */
          balance = await contract.balanceOf(account, this.token_id);
        }
      } catch (e) {
        logger.error("Error retrieving balance:", e);
      }
    }

    /** Convert to string */
    if (balance) {
      balance = balance.toString();
    }

    /** Return results */
    return parseFloat(balance);
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
