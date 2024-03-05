import { Connection, PublicKey } from '@solana/web3.js';

export default class HeliusWebhookReceiver {
  /**
   * This will initialize all of the hooks used by this plugin.
   * A plugin can register multiple hooks, each hook being linked to a function that will be executed when the hook is triggered
   */
  async init() {
    // Initialize connection to the Solana cluster using the custom RPC endpoint
    //this.connection = new Connection(this.rpc_url);

    return {
      ROUTES: {
        POST: {
          "receive": (req, res) => this.receiveWebhook(req, res)
        }
      }
    };
  }

  /** Will interpret the transaction details to identify which programs are being used by this transaction */
  async interpretTransactionDetails(transactionSignature) {
    let programsUsed = [];
    let signer;
    try {
        const transactionDetails = await this.connection.getTransaction(transactionSignature, {
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0
        });

        if (!transactionDetails) {
            console.log('Transaction not found');
            return [];
        }
        console.log("transactionDetails:", transactionDetails);


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
            if(programDetails) {
                programsUsed.push({
                    id: programId,
                    ...programDetails
                });
            } else {
                console.log("Unknown program used: ", programId);
            }
            
            // We could add some additional logic here to interpret the instruction data based on the program ID
        });
    } catch (error) {
        console.error('Error fetching transaction:', error);
    }

    // Filter for uniqueness
    const uniquePrograms = programsUsed.filter((program, index, self) =>
        index === self.findIndex((t) => (
            t.id === program.id
        ))
    );

    // Return all programs used by this transaction
    return {
        signer,
        programs: uniquePrograms
    };
  }

  /** Retrieve the transaction initiator */
  getInitiatingAddress(transaction) {
    // Check if there are any signatures
    if (transaction && transaction.signatures && transaction.signatures.length > 0) {
      // The first signature is typically the initiator's
      const initiatorSignature = transaction.signatures[0];
      
      // To get the address, we look at the first account in the staticAccountKeys array
      // that should be required to be a signer (based on the header).
      if (transaction.transaction.message.header.numRequiredSignatures > 0) {
        const initiatorAddress = transaction.transaction.message.staticAccountKeys[0];
        return initiatorAddress;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  /** Will retrieve the credentials for a Solana address and mint all of those */
  async receiveWebhook(req, res) {
    if(req.body) {
      //const { did } = req.body;
      console.log("Received webhook with body:", req.body);  
      res.json({ status: 200, result: "Received webhook" });
    } else {
      res.json({ status: 300 });
    }
  };
}


const solPrograms = {
  "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH": {
      name: "Drift Protocol V2",
      slug: "drift-v2",
      protocol: "drift"
  },
  "M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K": {
      name: "Magic Eden V2",
      slug: "magic-eden-v2",
      protocol: "magic-eden"
  },
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc": {
      name: "Orca",
      slug: "orca",
      protocol: "orca"
  },
  "JUP6i4ozu5ydDCnLiMogSckDPpbtr7BJ4FtzYWkb5Rk": {
      name: "Jupiter v1",
      slug: "jupiter-v1",
      protocol: "jupiter"
  },
  "JUP2jxvXaqu7NQY1GmNF4m1vodw12LVXYxbFL2uJvfo": {
      name: "Jupiter v2",
      slug: "jupiter-v2",
      protocol: "jupiter"
  },
  "JUP3c2Uh3WA4Ng34tw6kPd2G4C5BB21Xo36Je1s32Ph": {
      name: "Jupiter v3",
      slug: "jupiter-v3",
      protocol: "jupiter"
  },
  "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB": {
      name: "Jupiter v4",
      slug: "jupiter-v4",
      protocol: "jupiter"
  },
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4": {
      name: "Jupiter v6",
      slug: "jupiter-v6",
      protocol: "jupiter"
  },
  "PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY": {
      name: "Phoenix",
      slug: "phoenix",
      protocol: "phoenix"
  },
  "zDEXqXEG7gAyxb1Kg9mK5fPnUdENCGKzWrM21RMdWRq": {
      name: "Zeta",
      slug: "zeta",
      protocol: "zeta"
  },
  "So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo": {
      name: "Solend",
      slug: "solend",
      protocol: "solend"
  },
  "EewxydAPCCVuNEyrVN68PuSYdQ7wKn27V9Gjeoi8dy3S": {
      name: "Lifinity Swap",
      slug: "lifinity-swap-v1",
      protocol: "lifinity"
  },
  "2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c": {
      name: "Lifinity Swap V2",
      slug: "lifinity-swap-v2",
      protocol: "lifinity"
  },
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK": {
      name: "Raydium Concentrated Liquidity",
      slug: "raydium-concentrated-liquidity",
      protocol: "raydium"
  },
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": {
      name: "Raydium Liquidity Pool V4",
      slug: "raydium-liquidity-pool-v4",
      protocol: "raydium"
  },
  "SSwapUtytfBdBn1b9NUGG6foMVPtcWgpRU32HToDUZr": {
      name: "Saros",
      slug: "saros",
      protocol: "saros"
  },
  "hadeK9DLv9eA7ya5KCTqSvSvRZeJC3JgD5a9Y3CNbvu": {
      name: "Hadeswap",
      slug: "hadeswap",
      protocol: "hadeswap"
  },
  "TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN": {
      name: "Tensor Swap",
      slug: "tensor-swap",
      protocol: "tensor"
  },
  "TCMPhJdwDryooaGtiocG1u3xcYbRpiJzb283XfCZsDp": {
      name: "Tensor cNFT",
      slug: "tensor-cnft",
      protocol: "tensor"
  },
  "NeonVMyRX5GbCrsAHnUwx1nYYoJAtskU1bWUo6JGNyG": {
      name: "Neon EVM",
      slug: "neon-evm",
      protocol: "neon"
  },
  "jCebN34bUfdeUYJT13J1yG16XWQpt5PDx6Mse9GUqhR": {
    name: "Solana Name Service",
    slug: "solana-name-service",
    protocol: "solana-name-service"
  },
  "3parcLrT7WnXAcyPfkCz49oofuuf2guUKkjuFkAhZW8Y": {
    name: "Parcl",
    slug: "parcl",
    protocol: "parcl"
  },
  "KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD": {
    name: "Kamino Lending",
    slug: "kamino-lending",
    protocol: "kamino"
  }
}

/** Will extract the address from the did */
export function getAddress(did) {
  // Split the DID string into an array using ':' as the delimiter
  const parts = did.split(':');
  
  // Return the last element of the array
  return parts[parts.length - 1];
}