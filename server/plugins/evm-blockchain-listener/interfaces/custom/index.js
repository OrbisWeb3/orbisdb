import Web3 from "web3";

export default class CustomInterface {
  symbol;
  name;
  address;

  constructor(address, rpcUrl, abi, model) {
    this.address = address;
    this.model = model;
    console.log("listening to address:" + address + " with rpcUrl:", rpcUrl);

    try {
      // Initialize web3 with contract + RPC Url passed in parameters
      this.web3 = new Web3(new Web3.providers.WebsocketProvider(rpcUrl));

      // Initialize contract
      this.contract = new this.web3.eth.Contract(abi, address);
    } catch (e) {
      console.log("Error listening to contract:", e);
    }
  }

  /** This parse function will return a formatted JSON object per event type */
  parse(event) {
    let blockNumber = event.blockNumber.toString();
    blockNumber = parseInt(blockNumber);
    let content = {
      _auto_type: event.event,
      _auto_block_number: blockNumber,
      _auto_contract: this.address,
      _auto_hash: event.transactionHash,
    };

    // Add all keys and values from returnValues to the content object
    for (let key in event.returnValues) {
      if (event.returnValues.hasOwnProperty(key)) {
        // Filter out numeric keys and __length__
        if (isNaN(key) && key !== "__length__") {
          let value = event.returnValues[key];
          // Convert large integers to strings
          if (
            typeof value === "bigint" ||
            (typeof value === "number" &&
              (value > Number.MAX_SAFE_INTEGER ||
                value < Number.MIN_SAFE_INTEGER))
          ) {
            value = value.toString();
          }
          content[key] = value;
        }
      }
    }

    return {
      model_id: this.model,
      content,
    };
  }
}
