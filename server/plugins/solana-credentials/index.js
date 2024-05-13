import { Connection, PublicKey } from "@solana/web3.js";
import logger from "../../logger/index.js";

export default class SolanaCredentials {
  /**
   * This will initialize all of the hooks used by this plugin.
   * A plugin can register multiple hooks, each hook being linked to a function that will be executed when the hook is triggered
   */
  async init() {
    // Initialize connection to the Solana cluster using the custom RPC endpoint
    this.connection = new Connection(this.rpc_url);
    //this.createModel();

    return {
      HOOKS: {
        validate: (stream) => this.isValid(stream),
      },
      ROUTES: {
        POST: {
          mint: (req, res) => this.mintCredentials(req, res),
        },
      },
    };
  }

  async createModel() {
    const modelDefinition = {
      name: "light_credentials",
      version: "1.0",
      accountRelation: {
        type: "list",
      },
      schema: {
        type: "object",
        $schema: "https://json-schema.org/draft/2020-12/schema",
        properties: {
          receiver: {
            type: "string",
          },
          id: {
            type: "string",
          },
          slug: {
            type: "string",
          },
          name: {
            type: "string",
          },
          protocol: {
            type: "string",
          },
          count: {
            type: "number",
          },
        },
        additionalProperties: false,
      },
    };

    let result =
      await global.indexingService.ceramic.orbisdb.ceramic.createModel(
        modelDefinition
      );
    logger.debug("result new model:", result);
  }

  /** Load all transactions from a user */
  async getTransactions(address) {
    let allPrograms = {};

    // Fetch the transaction signatures for the address
    const transactions = await this.connection.getSignaturesForAddress(
      new PublicKey(address)
    );
    if (transactions) {
      logger.debug(address + " had " + transactions.length + " transactions.");

      for (const tx of transactions) {
        // Retrieve programs used by this transaction
        let { programs } = await this.interpretTransactionDetails(tx.signature);

        programs.forEach((program) => {
          if (allPrograms[program.id]) {
            allPrograms[program.id].count += 1;
          } else {
            allPrograms[program.id] = { ...program, count: 1 };
          }
        });
      }
    }

    return allPrograms;
  }

  // Will interpret the transaction details to identify which programs are being used by this transction
  async interpretTransactionDetails(transactionSignature) {
    let programsUsed = [];
    let signer;
    try {
      const transactionDetails = await this.connection.getTransaction(
        transactionSignature,
        {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        }
      );

      if (!transactionDetails) {
        logger.debug("Transaction not found");
        return [];
      }
      logger.debug("transactionDetails:", transactionDetails);

      // Retrieve signer
      signer = this.getInitiatingAddress(transactionDetails);

      // Retrieve instructions and account keys
      const { compiledInstructions } = transactionDetails.transaction.message;
      const { staticAccountKeys } = transactionDetails.transaction.message;

      compiledInstructions.forEach((instr, index) => {
        // Resolve the program ID using the programIdIndex to find it within the staticAccountKeys
        const programId = staticAccountKeys[instr.programIdIndex].toString();

        // Retrieve program details
        let programDetails = solPrograms[programId];
        if (programDetails) {
          programsUsed.push({
            id: programId,
            ...programDetails,
          });
        } else {
          logger.debug("Unknown program used: ", programId);
        }

        // We could add some additional logic here to interpret the instruction data based on the program ID
      });
    } catch (error) {
      logger.error("Error fetching transaction:", error);
    }

    // Filter for uniqueness
    const uniquePrograms = programsUsed.filter(
      (program, index, self) =>
        index === self.findIndex((t) => t.id === program.id)
    );

    // Return all programs used by this transaction
    return {
      signer,
      programs: uniquePrograms,
    };
  }

  // Retrieve the transaction initiator
  getInitiatingAddress(transaction) {
    // Check if there are any signatures
    if (
      transaction &&
      transaction.signatures &&
      transaction.signatures.length > 0
    ) {
      // The first signature is typically the initiator's
      const initiatorSignature = transaction.signatures[0];

      // To get the address, we look at the first account in the staticAccountKeys array
      // that should be required to be a signer (based on the header).
      if (transaction.transaction.message.header.numRequiredSignatures > 0) {
        const initiatorAddress =
          transaction.transaction.message.staticAccountKeys[0];
        return initiatorAddress;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  /** Will retrieve the credentials for a Solana address and mint all of those */
  async mintCredentials(req, res) {
    if (!req.body) {
      return res.badRequest("No request body found.");
    }

    let streams = [];

    const { did } = req.body;
    let address = getAddress(did);

    /** Retrieve credentials from the user */
    let credentials = await this.getTransactions(address);
    if (credentials) {
      let credentialsArr = Object.values(credentials);
      logger.debug("credentialsArr:", credentialsArr);

      /** Compute XP score */
      let xpScore = this.computeXPScore(credentialsArr);
      logger.debug("xpScore:", xpScore);
      await this.upsertScore(did, xpScore);

      /** Mint new credentials */
      for (const credential of credentialsArr) {
        let result = await this.upsertCredential(did, credential);
        streams.push(result);
      }
    }

    return {
      address,
      credentials,
      streams,
    };
  }

  // Function to compute XP score based on credentials
  computeXPScore(credentials) {
    let xpScore = 0; // Initialize XP score
    let protocolCounts = {}; // Object to track counts of each protocol used

    /** Compute initial XP score and track protocol usage */
    credentials.forEach((credential) => {
      if (protocolCounts[credential.protocol]) {
        protocolCounts[credential.protocol] += credential.count;
      } else {
        protocolCounts[credential.protocol] = credential.count;
      }

      // Initial XP calculation without multipliers
      xpScore += credential.count;
    });

    /** Apply multipliers based on usage frequency */
    Object.keys(protocolCounts).forEach((protocol) => {
      const count = protocolCounts[protocol];
      if (count > 10) {
        xpScore += count * 2; // Double the XP for this protocol
      } else if (count > 5) {
        xpScore += count * 1.5; // Multiply by 1.5 for this protocol
      }
    });

    /** Calculate total XP before applying unique protocol bonuses */
    let totalXP = xpScore;

    /** Apply bonuses based on the number of unique protocols used */
    const uniqueProtocols = Object.keys(protocolCounts).length;
    if (uniqueProtocols >= 20) {
      totalXP *= 3; // 200% bonus
    } else if (uniqueProtocols >= 10) {
      totalXP *= 2; // 100% bonus
    } else if (uniqueProtocols >= 5) {
      totalXP *= 1.5; // 50% bonus
    } else if (uniqueProtocols >= 3) {
      totalXP *= 1.1; // 10% bonus
    }

    return totalXP;
  }

  /** Mint the score */
  async upsertScore(did, xp) {
    let stream;

    try {
      stream = global.indexingService.ceramic.orbisdb
        .insert(
          "kjzl6hvfrbw6c88zjg5ep2zjj09vag9e3xtp48bo4jce2mvkef9117e0wbwxqp3"
        )
        .value({
          receiver: did,
          xp: xp,
        })
        .context(this.context)
        .run();

      logger.debug("stream:", stream);
    } catch (e) {
      logger.error("Stream:", e);
    }
  }

  /** Mint a credential for this user or update the existing one */
  async upsertCredential(did, credential) {
    let stream;
    let model =
      "kjzl6hvfrbw6c8g3qm4nwr2ifl43mfy6ik2e44ikw27ryoos7i1ttde24tcm4s8";

    // Step 1: Retrieve credential from db (to check if already exists)
    let existingCredential;
    try {
      existingCredential = await global.indexingService.ceramic.orbisdb
        .select()
        .from(model)
        .where({ receiver: did, slug: credential.slug })
        .context(this.context)
        .orderBy(["indexed_at", "desc"])
        .limit(1)
        .run();
    } catch (e) {
      logger.error("Error retrieving credential: ", e);
    }

    // Build content
    let content = {
      receiver: did,
      ...credential,
    };

    // Step 2: Insert or update
    if (existingCredential && existingCredential.rows.length > 0) {
      let cred = existingCredential.rows[0];
      // Update existing credential
      logger.debug("Should update existing credential:", cred);
      if (credential.count > cred.count) {
        logger.debug("Credential has changed, we UPDATE it.");
        stream = await global.indexingService.ceramic.orbisdb
          .update(cred.stream_id)
          .replace(content)
          .run();
      } else {
        logger.debug("Credential hasn't changed, we don't update it.");
      }
    } else {
      // Insert a new credential
      try {
        stream = await global.indexingService.ceramic.orbisdb
          .insert(model)
          .value(content)
          .context(this.context)
          .run();
      } catch (e) {
        logger.error("error inserting stream:", e);
      }
    }

    logger.debug("stream:", stream);

    return stream;
  }

  /** Will mark al of the streams as valid */
  isValid() {
    return true;
  }

  /** Returns a simple hello:world key value pair which will be added to the plugins_data field */
  async hello(stream) {
    return {
      hello: "world",
    };
  }

  /** Example of an API route returning a simple json object. The routes declared by a plugin are automatically exposed by the OrbisDB instance */
  helloApi(req, res) {
    res.json({
      hello: "world",
    });
  }

  /** Example of an API route returning a simple HTML page. The routes declared by a plugin are automatically exposed by the OrbisDB instance */
  async helloHtmlApi(req, res) {
    res.type("text/html");

    return `<!DOCTYPE html>
      <html>
        <head>
          <title>Simple Page</title>
        </head>
        <body>
          <h1>Hello, this is a simple HTML page</h1>
          <p>More content here...</p>
        </body>
      </html>`;
  }
}

const solPrograms = {
  dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH: {
    name: "Drift Protocol V2",
    slug: "drift-v2",
    protocol: "drift",
  },
  M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K: {
    name: "Magic Eden V2",
    slug: "magic-eden-v2",
    protocol: "magic-eden",
  },
  whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc: {
    name: "Orca",
    slug: "orca",
    protocol: "orca",
  },
  JUP6i4ozu5ydDCnLiMogSckDPpbtr7BJ4FtzYWkb5Rk: {
    name: "Jupiter v1",
    slug: "jupiter-v1",
    protocol: "jupiter",
  },
  JUP2jxvXaqu7NQY1GmNF4m1vodw12LVXYxbFL2uJvfo: {
    name: "Jupiter v2",
    slug: "jupiter-v2",
    protocol: "jupiter",
  },
  JUP3c2Uh3WA4Ng34tw6kPd2G4C5BB21Xo36Je1s32Ph: {
    name: "Jupiter v3",
    slug: "jupiter-v3",
    protocol: "jupiter",
  },
  JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB: {
    name: "Jupiter v4",
    slug: "jupiter-v4",
    protocol: "jupiter",
  },
  JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4: {
    name: "Jupiter v6",
    slug: "jupiter-v6",
    protocol: "jupiter",
  },
  PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY: {
    name: "Phoenix",
    slug: "phoenix",
    protocol: "phoenix",
  },
  zDEXqXEG7gAyxb1Kg9mK5fPnUdENCGKzWrM21RMdWRq: {
    name: "Zeta",
    slug: "zeta",
    protocol: "zeta",
  },
  So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo: {
    name: "Solend",
    slug: "solend",
    protocol: "solend",
  },
  EewxydAPCCVuNEyrVN68PuSYdQ7wKn27V9Gjeoi8dy3S: {
    name: "Lifinity Swap",
    slug: "lifinity-swap-v1",
    protocol: "lifinity",
  },
  "2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c": {
    name: "Lifinity Swap V2",
    slug: "lifinity-swap-v2",
    protocol: "lifinity",
  },
  CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK: {
    name: "Raydium Concentrated Liquidity",
    slug: "raydium-concentrated-liquidity",
    protocol: "raydium",
  },
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": {
    name: "Raydium Liquidity Pool V4",
    slug: "raydium-liquidity-pool-v4",
    protocol: "raydium",
  },
  SSwapUtytfBdBn1b9NUGG6foMVPtcWgpRU32HToDUZr: {
    name: "Saros",
    slug: "saros",
    protocol: "saros",
  },
  hadeK9DLv9eA7ya5KCTqSvSvRZeJC3JgD5a9Y3CNbvu: {
    name: "Hadeswap",
    slug: "hadeswap",
    protocol: "hadeswap",
  },
  TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN: {
    name: "Tensor Swap",
    slug: "tensor-swap",
    protocol: "tensor",
  },
  TCMPhJdwDryooaGtiocG1u3xcYbRpiJzb283XfCZsDp: {
    name: "Tensor cNFT",
    slug: "tensor-cnft",
    protocol: "tensor",
  },
  NeonVMyRX5GbCrsAHnUwx1nYYoJAtskU1bWUo6JGNyG: {
    name: "Neon EVM",
    slug: "neon-evm",
    protocol: "neon",
  },
  jCebN34bUfdeUYJT13J1yG16XWQpt5PDx6Mse9GUqhR: {
    name: "Solana Name Service",
    slug: "solana-name-service",
    protocol: "solana-name-service",
  },
  "3parcLrT7WnXAcyPfkCz49oofuuf2guUKkjuFkAhZW8Y": {
    name: "Parcl",
    slug: "parcl",
    protocol: "parcl",
  },
  KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD: {
    name: "Kamino Lending",
    slug: "kamino-lending",
    protocol: "kamino",
  },
};

/** Will extract the address from the did */
export function getAddress(did) {
  // Split the DID string into an array using ':' as the delimiter
  const parts = did.split(":");

  // Return the last element of the array
  return parts[parts.length - 1];
}
