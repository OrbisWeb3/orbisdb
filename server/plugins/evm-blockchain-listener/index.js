import logger from "../../logger/index.js";
import CustomInterface from "./interfaces/custom/index.js";
import ERC1155Interface from "./interfaces/erc1155/index.js";
import ERC20Interface from "./interfaces/erc20/index.js";
import ERC721Interface from "./interfaces/erc721/index.js";
import { cliColors } from "../../utils/cliColors.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blocksIndexedFilePath = path.join(__dirname, "blocks-indexed.json");

let custom_computing = {
  erc1155_balance: {
    name: "erc1155_balance",
    code: `
      let balances = {};
      // Array to store the results to be returned
      let results = [];
      // Helper function to update balances
      function updateBalance(address, id, amount) {
        if (!balances[address]) {
          balances[address] = {};
        }
        if (!balances[address][id]) {
          balances[address][id] = 0;
        }
        balances[address][id] += amount;
        return { owner: address, token_id: id, balance: balances[address][id] };
      }
      
      const { from, to, value, id } = event.content;

      if (from && from !== "0x0000000000000000000000000000000000000000") {
        // Decrease balance for sender
        const fromResult = updateBalance(from, id, -parseInt(value));
        results.push(fromResult);
      }
      if (to) {
        // Increase balance for receiver
        const toResult = updateBalance(to, id, parseInt(value));
        results.push(toResult);
      }

      // Return the results array (the results must fit the fields defined in this action)
      return results;`,
    fields: [
      {
        type: "string",
        name: "owner",
        unique: true,
      },
      {
        type: "string",
        name: "token_id",
      },
      {
        type: "number",
        name: "balance",
      },
    ],
  },
};

export default class EthereumEventPlugin {
  interface;
  customModels = {};
  logs = [];
  completed_historical_syncing = false;
  should_stop_indexing_past_events = false;

  async init() {
    return {
      HOOKS: {
        generate: () => this.start(),
      },
    };
  }

  async start() {
    this.contract_type = "custom";
    this.should_stop_indexing_past_events = false;
    console.log(
      `Initializing plugin with ${this.contract_type} contract type.`
    );

    this.addLog({
      color: "sky",
      title: `Initializing plugin with ${this.contract_type} contract type.`,
    });

    // Loop through all custom computing functions in order to create a custom table for those
    if (this.use_custom_computing == "yes" && this.custom_computing_id) {
      this.addLog({
        color: "sky",
        title: `Identified ${this.custom_computing_id} custom computing action to perform. Creating / loading a model for it.`,
      });

      // Create model for this custom action
      await this.createCustomModel(custom_computing[this.custom_computing_id]);
    }

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
            interface: false,
            implements: [],
            schema: properties,
          };

          // Create model
          try {
            model = await this.orbisdb.ceramic.createModel(schema);
            this.addLog({
              color: "sky",
              title: `Using model ${model.id} for events from this plugin.`,
            });
          } catch (e) {
            console.log(
              cliColors.text.red,
              "Error creating model for schema:",
              JSON.stringify(schema),
              cliColors.reset,
              e
            );
            this.addLog({
              color: "red",
              title: `Error creating or retrieving model for this plugin: ${e}`,
            });
          }
        }

        if (model) {
          this.interface = new CustomInterface(
            this.contract_address,
            this.rpc_url,
            abi,
            model?.id
          );
        } else {
          this.addLog({
            color: "red",
            title: `There was an error assigning a model to this plugin.`,
          });
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
    let from_block_number = "latest";
    if (this.from_block == "genesis") {
      from_block_number = getLatestBlockIndexed(0, this.uuid);
    } else if (this.from_block == "custom") {
      from_block_number = getLatestBlockIndexed(
        parseInt(this.custom_block_number),
        this.uuid
      );
    }

    // When genesis or custom start by listening to past events and then once completed subscribe to blocks starting from the block number when the plugin started running
    let currentBlockNumber;
    if (this.from_block == "genesis" || this.from_block == "custom") {
      // Get current block number
      currentBlockNumber = await this.interface.web3.eth.getBlockNumber();
      currentBlockNumber = parseInt(currentBlockNumber);

      // Retrieve past events based on the settings and latest block indexed (only if user didn't pick "latest")
      let batchSize = 1000; // Will retrieve events with 1000 blocks per batch
      let fromBlock = from_block_number;
      let toBlock = Math.min(fromBlock + batchSize, currentBlockNumber);

      try {
        console.log(
          `Enter loop to make sure we index every blocks in batches.`
        );
        while (fromBlock <= currentBlockNumber) {
          //console.log(`Current batch => fromBlock: ${fromBlock} and toBlock: ${toBlock}`);

          // Check if the stop flag is set
          if (this.should_stop_indexing_past_events) {
            console.log("Stopping the past events indexing as requested.");
            break; // Exit the main loop
          }

          // Fetch past events in the current block range
          const events = await this.interface.contract.getPastEvents(
            this.event_name,
            {
              fromBlock: fromBlock,
              toBlock: toBlock,
            }
          );

          // Check if the stop flag is set
          if (this.should_stop_indexing_past_events) {
            console.log("Stopping the past events indexing as requested.");
            break; // Exit the main loop
          }

          if (!events || events.length == 0) {
            // Update latest block parsed
            this.updateLatestBlockIndexed(this.uuid, toBlock);
          } else {
            // Handle all events retrieved in this batch
            for (const event of events) {
              // Check if the stop flag is set before handling the event
              if (this.should_stop_indexing_past_events) {
                console.log("Stopping event handling as requested.");
                break; // Exit the events loop
              }

              // Wait for the event handler to complete before moving to the next event
              await this.handleEvent(event, true);
            }
          }

          // Log the total number of events found
          //console.log(`Total ${events.length} events found and indexed in this batch.`);

          // Move to the next batch
          fromBlock = toBlock + 1;
          toBlock = Math.min(fromBlock + batchSize, currentBlockNumber);
        }
      } catch (e) {
        this.addLog({
          color: "red",
          title: `Error retrieving past events: ${e.message}`,
        });
      }
    }

    this.addLog({
      color: "sky",
      title: `Finished parsing historical events. Now trying to subscribe to new events in real-time.`,
    });

    // Keep track of historical syncing being completed to mark the progress bar as 100%
    this.completed_historical_syncing = true;

    // When "latest" in the settings or when past events have been handled we start listening to smart contract event either from the latest synced block or "latest"
    try {
      this.subscription = this.interface.contract?.events?.allEvents({
        fromBlock: currentBlockNumber ? currentBlockNumber : "latest",
      });
      this.subscription.on("data", (event) => this.handleEvent(event, false));
      this.subscription.on("error", console.error);
      logger.debug(
        "⭐️ Starting to listen to smart contract events:",
        this.contract_type
      );
      this.addLog({
        color: "sky",
        title: `⭐️ Started to listen to real time events: ${this.event_name}`,
      });
    } catch (e) {
      logger.error(
        "Error subscribing to event fron this smart contract:",
        this.contract_address
      );
      this.addLog({
        color: "red",
        title: `Error subscribing to event fron this smart contract:: ${this.contract_address}`,
      });
    }
  }

  // Will unsubscribe from the web3 subscription once plugin is stopped
  async stop() {
    this.should_stop_indexing_past_events = true;
    console.log("Trying to stop web3 subscription for:", this.uuid);
    try {
      await this.subscription?.unsubscribe();
      console.log("Success unsubscribing from contract events.");
    } catch (e) {
      console.log("Error unsubscribing from contract events:", e);
    }
  }

  // Will be called when plugin is updated (to make sure we reindex everything using the new settings)
  reset() {
    console.log("Resetting plugin settings and data because of user update.");
    this.should_stop_indexing_past_events = true;
    this.addLog({
      color: "amber",
      title: `Resetting plugin settings and data because of user update.`,
    });

    this.completed_historical_syncing = false;
    this.resetBlockIndexData();
  }

  // Function to handle detected events
  handleEvent = async (event, saveBlockNumberIndexed = true) => {
    if (event.event == this.event_name) {
      let _event = this.interface.parse(event);

      // Insert event as a new stream
      if (_event.model_id) {
        try {
          let stream = await this.orbisdb
            .insert(_event.model_id)
            .value(_event.content)
            .context(this.context)
            .run();

          // Save latest block number in block settings file
          if (saveBlockNumberIndexed) {
            let blockNumber = event.blockNumber.toString();
            blockNumber = parseInt(blockNumber);
            this.updateLatestBlockIndexed(this.uuid, blockNumber);
            this.incrementCountEventsIndexed(this.uuid);
          }
        } catch (e) {
          console.log("Error creating stream:", e);
        }

        // Run custom computing code
        if (this.use_custom_computing == "yes" && this.custom_computing_id) {
          // Loop through all custom computings
          await this.customCompute(
            _event,
            custom_computing[this.custom_computing_id]
          );
        }
      }
    }
  };

  /** Will perform custom computing on top of the formatted event in order to have a more advanced indexing */
  async customCompute(event, action) {
    // Require model id
    const modelId = this.customModels[action.name];
    if (!modelId) {
      console.error(`Model ID not found for ${action.name}`);
      return;
    }

    try {
      // Dynamically create a function from the code string and execute it
      const computeFunction = new Function("event", action.code);
      const actionResults = computeFunction(event);

      // Validate and store the results
      if (Array.isArray(actionResults)) {
        for (const result of actionResults) {
          await this.insertCustomResult(result, modelId);
        }
      } else if (typeof actionResults === "object" && actionResults !== null) {
        await this.insertCustomResult(actionResults, modelId);
      } else {
        console.log(
          `Expected an array or an object from ${action.name}, got:`,
          actionResults
        );
      }
    } catch (error) {
      console.log(`Error executing custom code for ${action.name}:`, error);
      this.addLog({
        color: "red",
        title: `Error executing custom code for ${action.name}:`,
        error,
      });
    }
  }

  /** Will insert a result into the database using the specified model ID */
  async insertCustomResult(result, modelId) {
    try {
      // Insert the result into the specified model
      const stream = await this.orbisdb
        .insert(modelId)
        .value(result)
        .context(this.context)
        .run();

      console.log(
        `Successfully inserted result with stream ID: ${stream.id} in ${modelId}`
      );
    } catch (error) {
      console.log("Error inserting custom result:", error);
      this.addLog({
        color: "red",
        title: "Error inserting custom result:",
        error,
      });
    }
  }

  // Will create custom models for each custom computing function based on the fields
  createCustomModel = async (action) => {
    console.log(`Creating custom model for: ${action.name}`);

    // Generate the schema based on the fields defined in the action
    let properties = {};
    for (const field of action.fields) {
      properties[field.name] = { type: field.type };
      if (field.unique) {
        properties[field.name].$comment = '{ "unique": true }';
      }
    }

    const schema = {
      name: `${action.name}_model`,
      version: "1.0",
      accountRelation: { type: "list" },
      interface: false,
      implements: [],
      schema: {
        type: "object",
        $schema: "https://json-schema.org/draft/2020-12/schema",
        additionalProperties: false,
        properties: properties,
        required: action.fields.map((field) => field.name),
      },
    };

    // Create the model using OrbisDB
    try {
      const model = await this.orbisdb.ceramic.createModel(schema);
      this.addLog({
        color: "sky",
        title: `Custom model created for ${action.name} with ID: ${model.id}`,
      });
      if (model) {
        // Store the model ID for future use
        this.customModels[action.name] = model.id;
        console.log(`Model created for ${action.name} with ID: ${model.id}`);
      }
    } catch (e) {
      console.error(`Error creating model for ${action.name}:`, e);
      this.addLog({
        color: "red",
        title: `Error creating model for ${action.name}:`,
        e,
      });
    }
  };

  // Will read the blocks-indexed file and returns the results
  readBlocksIndexedData() {
    let blocksIndexed = {};
    try {
      if (fs.existsSync(blocksIndexedFilePath)) {
        const dataBlocksIndexed = fs.readFileSync(
          blocksIndexedFilePath,
          "utf8"
        );
        blocksIndexed = JSON.parse(dataBlocksIndexed);
      }
    } catch (err) {
      console.error("Error reading block indexed settings file:", err);
    }
    return blocksIndexed;
  }

  // Will save the blocks-indexed settings file with latest details
  writeBlocksIndexedData(blocksIndexed) {
    try {
      fs.writeFileSync(
        blocksIndexedFilePath,
        JSON.stringify(blocksIndexed, null, 2),
        "utf8"
      );
    } catch (err) {
      console.error("Error writing to block indexed settings file:", err);
    }
  }

  // Will update just the latestBlockIndexed info
  updateLatestBlockIndexed(uuid, blockNumber) {
    let blocksIndexed = this.readBlocksIndexedData();

    // Initialize the object for this UUID if it doesn't exist
    if (!blocksIndexed[uuid]) {
      blocksIndexed[uuid] = {
        latestBlockIndexed: 0,
        countEventsIndexed: 0,
      };
    }

    // Update the latest block indexed
    blocksIndexed[uuid].latestBlockIndexed = blockNumber;

    // Write the updated data back to the file
    this.writeBlocksIndexedData(blocksIndexed);
  }

  // Will increment count events indexed
  incrementCountEventsIndexed(uuid) {
    let blocksIndexed = this.readBlocksIndexedData();

    // Initialize the object for this UUID if it doesn't exist
    if (!blocksIndexed[uuid]) {
      blocksIndexed[uuid] = {
        latestBlockIndexed: 0,
        countEventsIndexed: 0,
      };
    }

    // Increment the event count
    blocksIndexed[uuid].countEventsIndexed += 1;

    // Write the updated data back to the file
    this.writeBlocksIndexedData(blocksIndexed);
  }

  // Will be used when plugin is updated
  resetBlockIndexData() {
    let blocksIndexed = this.readBlocksIndexedData();

    // Initialize the object for this UUID if it doesn't exist
    if (!blocksIndexed[this.uuid]) {
      blocksIndexed[this.uuid] = {
        latestBlockIndexed: 0,
        countEventsIndexed: 0,
      };
    } else {
      // Reset both values to 0
      blocksIndexed[this.uuid].latestBlockIndexed = 0;
      blocksIndexed[this.uuid].countEventsIndexed = 0;
    }

    console.log("New blocksIndexed:", blocksIndexed);

    // Write the updated data back to the file
    this.writeBlocksIndexedData(blocksIndexed);
  }

  // Will retrieve current block indexed in order to display it in the dynamic variables
  getCurrentBlockIndexed() {
    try {
      const data = fs.readFileSync(blocksIndexedFilePath, "utf8");
      const blocksIndexed = JSON.parse(data);
      if (blocksIndexed[this.uuid]) {
        return blocksIndexed[this.uuid].latestBlockIndexed;
      } else {
        return 0;
      }
    } catch (error) {
      console.error("Error reading current block indexed:", error);
      return 0;
    }
  }

  // Will return the current indexing progress in order to display it in the UI
  async getIndexingProgress(fromBlock, currentBlockNumber) {
    const currentBlockIndexed = this.getCurrentBlockIndexed();

    // Calculate the total number of blocks to index from the starting block
    const totalBlocksToIndex = currentBlockNumber - fromBlock;

    // Calculate the progress percentage
    const progress =
      ((currentBlockIndexed - fromBlock) / totalBlocksToIndex) * 100;

    return progress.toFixed(2);
  }

  // Will expose dynamic variables that can be exposed on the front end
  async getDynamicVariables() {
    // Load blocs settings file
    const data = fs.readFileSync(blocksIndexedFilePath, "utf8");
    const blocksIndexed = JSON.parse(data);

    // Retrieve some variables
    let currentBlockIndexed = this.getCurrentBlockIndexed();
    let currentBlockNumber;
    if (this.interface) {
      currentBlockNumber = await this.interface.web3.eth.getBlockNumber();
      currentBlockNumber = parseInt(currentBlockNumber);
    } else {
      currentBlockNumber =
        "Error retrieving current block number for this blockchain.";
    }

    // Retrieve from block number
    let from_block_number = 0;
    if (this.from_block == "genesis") {
      from_block_number = 0;
    } else if (this.from_block == "custom") {
      from_block_number = parseInt(this.custom_block_number);
    }

    let progress = await this.getIndexingProgress(
      from_block_number,
      currentBlockNumber
    );

    // Return dynamic variables as an array
    return {
      results: [
        {
          name: "Indexing Progress",
          type: "slider",
          progress: this.completed_historical_syncing
            ? 100
            : progress
              ? progress
              : 0,
          value: currentBlockIndexed,
          start: from_block_number,
          end: currentBlockNumber,
        },
        {
          name: "Last Indexed Block Number",
          value: currentBlockIndexed,
        },
        {
          name: "Current Blockchain Block Number",
          value: currentBlockNumber,
        },
        {
          name: "Count Events Inserted",
          value: blocksIndexed[this.uuid]
            ? blocksIndexed[this.uuid].countEventsIndexed
            : 0,
        },
        {
          name: "Logs",
          value: this.logs,
          type: "logs",
        },
      ],
    };
  }

  // Will handle logs for this plugin
  addLog(newLog) {
    // Add the new log to the array
    this.logs.push(newLog);

    // If the array length exceeds 50, remove the oldest logs
    if (this.logs.length > 50) {
      this.logs.splice(0, this.logs.length - 50);
    }
  }
}

// Will retrieve from the settings the latest block indexed by this plugin
function getLatestBlockIndexed(min, uuid) {
  // Read the current indexing timestamps
  let blocksIndexed = {};
  let latestIndexedBlock = 0; // Default to epoch time
  try {
    if (fs.existsSync(blocksIndexedFilePath)) {
      const dataBlocksIndexed = fs.readFileSync(blocksIndexedFilePath, "utf8");
      blocksIndexed = JSON.parse(dataBlocksIndexed);
      console.log("blocks indexed details:", blocksIndexed);
      if (blocksIndexed && blocksIndexed[uuid]) {
        latestIndexedBlock = blocksIndexed[uuid].latestBlockIndexed;
      }
    }
  } catch (err) {
    console.error("Error reading block indexed settings file:", err);
  }

  // We check if the latest block indexed is superior to the start block to index from the settings (it should be) if it is we return the latest block indexed + 1 to start with the following block
  if (latestIndexedBlock && latestIndexedBlock > min) {
    return latestIndexedBlock + 1;
  } else {
    return min;
  }
}

// Will return all events found in the ABI
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
      _auto_block_number: {
        type: "number",
        description: "Automatically generated event name",
      },
      _auto_contract: {
        type: "string",
        description: "Automatically generated contract address",
      },
      _auto_hash: {
        type: "string",
        description: "Automatically generated transaction hash",
        $comment: '{ "unique": true }',
      },
    },
    required: [],
  };

  event.inputs.forEach((input) => {
    schema.properties[input.name] = {
      type: getType(input.type),
      description: input.internalType ? input.internalType : "",
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
      return "string";
    case "uint256":
      return "string";
    case "int256":
      return "string";
    default:
      return "string"; // default type if not matched
  }
}
