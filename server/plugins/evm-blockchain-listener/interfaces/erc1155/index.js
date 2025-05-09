import Web3 from "web3";

export default class ERC1155Interface {
  symbol;
  name;
  address;

  constructor(address, rpcUrl) {
    this.address = address;
    console.log("listening to address:" + address + " with rpcUrl:", rpcUrl);

    // Initialize web3 with contract + RPC Url passed in parameters
    this.web3 = new Web3(new Web3.providers.WebsocketProvider(rpcUrl));

    // Initialize contract
    this.contract = new this.web3.eth.Contract(erc1155Abi, address);

    // Retrieve token details
    this.loadTokenDetails();
  }

  async loadTokenDetails() {
    try {
      this.symbol = await this.contract.methods.symbol().call();
      this.name = await this.contract.methods.name().call();

      console.log(
        "ERC1155 Token details - Name:",
        this.name,
        "Symbol:",
        this.symbol
      );
    } catch (error) {
      console.error("Error fetching token details:", error);
    }
  }

  /** This parse function will return a formatted JSON object per event type */
  parse(event) {
    let content;
    let model_id;
    console.log("event.event:", event.event);
    console.log("event:", event);

    switch (event.event) {
      case "Spawned":
        model_id = "";
        content = {
          type: "Spawned",
          contract: this.address,
          hash: event.transactionHash,
          initiator: event.returnValues.initiator,
          marketParameters: event.returnValues.marketParameters,
          tokenId: this.returnValues.tokenId.toString(),
          symbol: this.symbol ? this.symbol : "",
          name: this.name ? this.name : "",
        };
        break;
      case "Transfer":
        model_id = "";
        content = {
          type: "Transfer",
          contract: this.address,
          hash: event.transactionHash,
          from: event.returnValues.from,
          to: event.returnValues.to,
          tokenId: this.returnValues.tokenId.toString(),
          symbol: this.symbol ? this.symbol : "",
          name: this.name ? this.name : "",
        };
        break;
      case "Approval":
        model_id = null; // Replace with actual model ID
        content = {
          type: "Approval",
          contract: this.address,
          hash: event.transactionHash,
          owner: event.returnValues.owner,
          spender: event.returnValues.spender,
          symbol: this.symbol || "",
          name: this.name || "",
        };
        break;

      case "Mint":
        model_id = null; // Replace with actual model ID
        content = {
          type: "Mint",
          contract: this.address,
          hash: event.transactionHash,
          minter: event.returnValues.minter,
          to: event.returnValues.to,
          symbol: this.symbol || "",
          name: this.name || "",
        };
        break;
    }
    return {
      model_id,
      content,
    };
  }
}

let erc1155Abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
    ],
    name: "AddressEmptyCode",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "AddressInsufficientBalance",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "enum MarketState",
        name: "expected",
        type: "uint8",
      },
      {
        internalType: "enum MarketState",
        name: "actual",
        type: "uint8",
      },
    ],
    name: "BadState",
    type: "error",
  },
  {
    inputs: [],
    name: "BalanceTooLow",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "needed",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ERC1155InsufficientBalance",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "approver",
        type: "address",
      },
    ],
    name: "ERC1155InvalidApprover",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "idsLength",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "valuesLength",
        type: "uint256",
      },
    ],
    name: "ERC1155InvalidArrayLength",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "ERC1155InvalidOperator",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "ERC1155InvalidReceiver",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "ERC1155InvalidSender",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "ERC1155MissingApprovalForAll",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "ERC1967InvalidImplementation",
    type: "error",
  },
  {
    inputs: [],
    name: "ERC1967NonPayable",
    type: "error",
  },
  {
    inputs: [],
    name: "FailedInnerCall",
    type: "error",
  },
  {
    inputs: [],
    name: "InsufficientPayment",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidInitialization",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidTokenId",
    type: "error",
  },
  {
    inputs: [],
    name: "MathOverflowedMulDiv",
    type: "error",
  },
  {
    inputs: [],
    name: "NotInitializing",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [],
    name: "PriceDriftTooHigh",
    type: "error",
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error",
  },
  {
    inputs: [],
    name: "TokenAlreadyExists",
    type: "error",
  },
  {
    inputs: [],
    name: "TradeSizeOutOfRange",
    type: "error",
  },
  {
    inputs: [],
    name: "TransferRestricted",
    type: "error",
  },
  {
    inputs: [],
    name: "UUPSUnauthorizedCallContext",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "slot",
        type: "bytes32",
      },
    ],
    name: "UUPSUnsupportedProxiableUUID",
    type: "error",
  },
  {
    inputs: [],
    name: "UnauthorizedAccess",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "ApprovalForAll",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "beneficiary",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "claimedAmount",
        type: "uint256",
      },
    ],
    name: "ClaimedCollateral",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "ContributionTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "claimableCapital",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "feeRecipient",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "collectedFees",
        type: "uint256",
      },
    ],
    name: "Expired",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "FundingGoalReached",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint64",
        name: "version",
        type: "uint64",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint64",
        name: "newDeadline",
        type: "uint64",
      },
    ],
    name: "NegotiationDeadlineExtended",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "initiator",
        type: "address",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "projectId",
            type: "string",
          },
          {
            internalType: "address",
            name: "sourcer",
            type: "address",
          },
          {
            internalType: "address",
            name: "beneficiary",
            type: "address",
          },
          {
            internalType: "contract IIPSeedCurve",
            name: "priceCurve",
            type: "address",
          },
          {
            internalType: "bytes32",
            name: "curveParameters",
            type: "bytes32",
          },
          {
            internalType: "uint128",
            name: "fundingGoal",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "premint",
            type: "uint128",
          },
          {
            internalType: "uint64",
            name: "deadline",
            type: "uint64",
          },
        ],
        indexed: false,
        internalType: "struct MarketParameters",
        name: "marketParameters",
        type: "tuple",
      },
    ],
    name: "Spawned",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "feeRecipient",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "paidOutFees",
        type: "uint256",
      },
    ],
    name: "Succeeded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "trader",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "enum TradeType",
        name: "tradeType",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "grossEthAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newSupply",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tradingFee",
        type: "uint256",
      },
    ],
    name: "Traded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "values",
        type: "uint256[]",
      },
    ],
    name: "TransferBatch",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "TransferSingle",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "contract IPSeedTrust",
        name: "newTrustContract",
        type: "address",
      },
    ],
    name: "TrustContractUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "value",
        type: "string",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "URI",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "Upgraded",
    type: "event",
  },
  {
    inputs: [],
    name: "UPGRADE_INTERFACE_VERSION",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "accounts",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
    ],
    name: "balanceOfBatch",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "claimCollateral",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "collateral",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sourcer",
        type: "address",
      },
      {
        internalType: "string",
        name: "projectId",
        type: "string",
      },
    ],
    name: "computeTokenId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "contributions",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "depositedFees",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "exists",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "exit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "uint64",
        name: "newDeadline",
        type: "uint64",
      },
    ],
    name: "extendNegotiationDeadline",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "tokenAmount",
        type: "uint256",
      },
    ],
    name: "getBuyPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "gross",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "net",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "tradingFee",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "getMarketData",
    outputs: [
      {
        components: [
          {
            internalType: "enum MarketState",
            name: "state",
            type: "uint8",
          },
          {
            internalType: "uint256",
            name: "collateral",
            type: "uint256",
          },
          {
            internalType: "uint64",
            name: "negotiationDeadline",
            type: "uint64",
          },
          {
            internalType: "uint256",
            name: "accruedCapital",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "claimableCapital",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "collectedFees",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "refundableCapital",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "finalSupply",
            type: "uint256",
          },
        ],
        internalType: "struct MarketData",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "getMarketParams",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "projectId",
            type: "string",
          },
          {
            internalType: "address",
            name: "sourcer",
            type: "address",
          },
          {
            internalType: "address",
            name: "beneficiary",
            type: "address",
          },
          {
            internalType: "contract IIPSeedCurve",
            name: "priceCurve",
            type: "address",
          },
          {
            internalType: "bytes32",
            name: "curveParameters",
            type: "bytes32",
          },
          {
            internalType: "uint128",
            name: "fundingGoal",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "premint",
            type: "uint128",
          },
          {
            internalType: "uint64",
            name: "deadline",
            type: "uint64",
          },
        ],
        internalType: "struct MarketParameters",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "currentCollateral",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "fundingGoal",
        type: "uint256",
      },
    ],
    name: "getRemainingCapital",
    outputs: [
      {
        internalType: "uint256",
        name: "gross",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "net",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IIPSeedMetadataRenderer",
        name: "_metadataRenderer",
        type: "address",
      },
      {
        internalType: "contract IPSeedTrust",
        name: "_trustContract",
        type: "address",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "isApprovedForAll",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minTokenAmount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [
      {
        internalType: "uint256",
        name: "gross",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "net",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "tokensToMint",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "negotiationFailed",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "projectSucceeded",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "proxiableUUID",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "currentCollateral",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "ethValue",
        type: "uint256",
      },
    ],
    name: "quoteTokensForEth",
    outputs: [
      {
        internalType: "uint256",
        name: "tokenAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "gross",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "net",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "tradingFee",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "reimburse",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "values",
        type: "uint256[]",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "safeBatchTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IPSeedTrust",
        name: "_trustContract",
        type: "address",
      },
    ],
    name: "setIPSeedTrust",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "settle",
    outputs: [
      {
        internalType: "enum MarketState",
        name: "state",
        type: "uint8",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "projectId",
            type: "string",
          },
          {
            internalType: "address",
            name: "sourcer",
            type: "address",
          },
          {
            internalType: "address",
            name: "beneficiary",
            type: "address",
          },
          {
            internalType: "contract IIPSeedCurve",
            name: "priceCurve",
            type: "address",
          },
          {
            internalType: "bytes32",
            name: "curveParameters",
            type: "bytes32",
          },
          {
            internalType: "uint128",
            name: "fundingGoal",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "premint",
            type: "uint128",
          },
          {
            internalType: "uint64",
            name: "deadline",
            type: "uint64",
          },
        ],
        internalType: "struct MarketParameters",
        name: "params",
        type: "tuple",
      },
    ],
    name: "spawn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "trustContract",
    outputs: [
      {
        internalType: "contract IPSeedTrust",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newImplementation",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "uri",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
