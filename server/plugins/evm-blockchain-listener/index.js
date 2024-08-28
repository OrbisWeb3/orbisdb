import logger from "../../logger/index.js";
import CustomInterface from "./interfaces/custom/index.js";
import ERC1155Interface from "./interfaces/erc1155/index.js";
import ERC20Interface from "./interfaces/erc20/index.js";
import ERC721Interface from "./interfaces/erc721/index.js";
import { cliColors } from "../../utils/cliColors.js";

export default class EthereumEventPlugin {
  interface;

  async init() {
    return {
      HOOKS: {
        generate: () => this.start(),
      },
    };
  }

  async start() {
    console.log("Enter start() in EthereumEventPlugin");
    this.contract_type = "custom";
    // Will pick which interface to use based on the type of smart contract being listened to (ex: ERC20, ERC721 etc)
    switch (this.contract_type) {
      case "erc20":
        this.interface = new ERC20Interface(
          this.contract_address,
          this.rpc_url
        );
        break;
      case "erc721":
        this.interface = new ERC721Interface(
          this.contract_address,
          this.rpc_url
        );
        break;
      case "erc1155":
        this.interface = new ERC1155Interface(
          this.contract_address,
          this.rpc_url
        );
        break;
      case "custom":
        // If custom create and save model id
        let abi;
        let events = [];
        let event;
        let schema;
        let model;

        try {
          abi = JSON.parse(this.contract_abi);
          events = getEventsFromABI(this.contract_abi);
        } catch (e) {
          console.log("error parsing abi:", e);
        }

        if (events) {
          event = events.find((event) => event.name == this.event_name);
        }

        if (event) {
          // Generate custom schema for the selected event
          let properties = createJsonSchemaForEvent(event);
          schema = {
            name: this.event_name + "_model",
            version: "2.0",
            accountRelation: {
              type: "list",
            },
            interface: false, // Assuming this field is part of your ModelDefinitionV2
            implements: [], // Example field for ModelDefinitionV2
            schema: properties,
          };

          // Create model
          try {
            model = await this.orbisdb.ceramic.createModel(schema);
          } catch (e) {
            console.log(
              cliColors.text.red,
              "Error creating model:",
              cliColors.reset,
              e
            );
          }
        }

        if (model) {
          this.interface = new CustomInterface(
            this.contract_address,
            this.rpc_url,
            abi,
            model?.id
          );
        }

        break;
      default:
        this.interface = new ERC20Interface(
          this.contract_address,
          this.rpc_url
        );
        break;
    }

    // Subscribe to event selected by user
    try {
      this.subscription = this.interface.contract?.events?.allEvents({
        fromBlock: "latest",
      });
      this.subscription.on("data", this.handleEvent);
      this.subscription.on("error", console.error);
      logger.debug(
        "⭐️ Starting to listen to smart contract events:",
        this.contract_type
      );
    } catch (e) {
      logger.error(
        "Error subscribing to event fron this smart contract:",
        this.contract_address
      );
    }
  }

  async stop() {
    console.log("Trying to stop web3 subscription for:", this.uuid);
    try {
      await this.subscription?.unsubscribe();
      console.log("Success unsubscribing from contract events.");
    } catch (e) {
      console.log("Error unsubscribing from contract events:", e);
    }
  }

  // Function to handle detected events
  handleEvent = async (event) => {
    if (event.event == this.event_name) {
      let _event = this.interface.parse(event);
      console.log("Formatted event:", _event);

      // Insert event as a new stream
      if (_event.model_id) {
        try {
          let stream = await this.orbisdb
            .insert(_event.model_id)
            .value(_event.content)
            .context(this.context)
            .run();
        } catch (e) {
          console.log("Error creating stream:", e);
        }
      }
    }
  };
}

function getEventsFromABI(abi) {
  let events = [];
  try {
    let abiJson = JSON.parse(abi);
    events = abiJson.filter((item) => item.type === "event");
  } catch (e) {
    console.log("Error parsing ABI.");
  }

  return events;
}

/** Will create the json schema for this event */
function createJsonSchemaForEvent(event) {
  if (!event || !event.inputs) {
    throw new Error("Invalid event object");
  }

  const schema = {
    type: "object",
    $schema: "https://json-schema.org/draft/2020-12/schema",
    additionalProperties: false,
    properties: {
      _auto_type: {
        type: "string",
        description: "Automatically generated event name",
      },
      _auto_contract: {
        type: "string",
        description: "Automatically generated contract address",
      },
      _auto_hash: {
        type: "string",
        description: "Automatically generated transaction hash",
      },
    },
    required: [],
  };

  event.inputs.forEach((input) => {
    schema.properties[input.name] = {
      type: getType(input.type),
      description: input.internalType,
    };
    // Assuming all inputs are required
    schema.required.push(input.name);
  });

  return schema;
}

/** Will convert solidity types in json types */
function getType(solidityType) {
  switch (solidityType) {
    case "address":
      return "string";
    case "uint8":
    case "int8":
      return "integer";
    case "bool":
      return "boolean";
    case "bytes":
    case "string":
    case "uint256":
    case "int256":
      return "string";
    default:
      return "string"; // default type if not matched
  }
}

