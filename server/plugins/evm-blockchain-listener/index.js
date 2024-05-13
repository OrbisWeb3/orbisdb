import Web3 from "web3";
import logger from "../../logger/index.js";

export default class EthereumEventPlugin {
  async init() {
    return {
      HOOKS: {
        generate: () => this.start(),
      },
    };
  }

  start() {
    // Create contract instance
    const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eb48";
    const USDC_ABI = [
      // ABI for Transfer Event
      {
        anonymous: false,
        inputs: [
          { indexed: true, name: "from", type: "address" },
          { indexed: true, name: "to", type: "address" },
          { indexed: false, name: "value", type: "uint256" },
        ],
        name: "Transfer",
        type: "event",
      },
    ];
    //const contract = new this.web3.eth.Contract(USDC_ABI, USDC_ADDRESS);
    // console.log("Contract created with success.");
    try {
      const provider = new Web3.providers.WebsocketProvider(
        "wss://mainnet.infura.io/v3/9bf71860bc6c4560904d84cd241ab0a0",
        {
          clientConfig: {
            keepalive: true,
            keepaliveInterval: 60000,
          },
          reconnect: {
            auto: true,
            delay: 5000,
            maxAttempts: 5,
            onTimeout: false,
          },
        }
      );

      provider.on("connect", () => {
        logger.debug("Websocket connected.");
      });

      provider.on("close", (event) => {
        logger.debug(event);
        logger.debug("Websocket closed.");
      });

      provider.on("error", (error) => {
        logger.error("Error subscribing to websocket:", error.message);
      });
    } catch (e) {
      logger.error("Error setting up web3 provider.");
    }

    /*const web3 = new Web3(provider);
        const contract = new web3.eth.Contract(USDC_ABI, USDC_ADDRESS);
        contract.events.Transfer()
        .on("connected", (id) => {
            console.log(`PairCreated subscription connected (${id})`);
        }
        ).on("data", (event) => {
            console.log(event);

        }).on("error", (error) => {
            console.log(error);
        })*/

    // Event subscription
    // Subscribe to Transfer Events

    logger.debug("⭐️ Starting to listen to smart contract events.");
  }

  async processEvent(event) {
    logger.debug("Received event:", event);
  }
}
