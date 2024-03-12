import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export default class SolanaTokenGating {
  /**
   * This will initialize all of the hooks used by this plugin.
   * A plugin can register multiple hooks, each hook being linked to a function that will be executed when the hook is triggered
   */
  async init() {
    // Initialize connection to the Solana cluster using the custom RPC endpoint
    this.connection = new Connection(this.rpc_url);
    this.getSolBalance("did:pkh:solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:6cVosYA8teAzZ7bhK3Uc3Gen6WgMfdsHTssKZ3iCSxhy");

    return {
      HOOKS: {
        "validate": (stream) => this.isValid(stream)
      },
      ROUTES: {
        GET: {
          "balance": (req, res) => this.getBalance(req, res)
        }
      }
    };
  }

  async getSolBalance(did) {
  
    // Get address and network from did
    let address = getAddress(did);
    console.log("address:", address);

    // The public key of the account you want to check the balance of
    // Replace 'YourAccountPublicKeyHere' with the actual public key
    const accountPublicKey = new PublicKey(address);
  
    try {
      // Fetch the balance
      const balance = await this.connection.getBalance(accountPublicKey);
  
      // Convert the balance from lamports to SOL
      const balanceInSol = balance / LAMPORTS_PER_SOL;
  
      console.log(`Balance: ${balanceInSol}`);
      return balanceInSol;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  /** Will mark al of the streams as valid */
  async isValid(stream) {
    let balance = await this.getSolBalance(stream.controller);
    let requiredAmount = parseFloat(this.min_amount);
    console.log("requiredAmount:", requiredAmount);
    if(balance >= requiredAmount) {
        return true;
    } else {
        return false;
    }
  }

  /** Returns a simple hello:world key value pair which will be added to the plugins_data field */
  async getBalance(req, res) {
    console.log("Params in getBalance:", req.params)
    let did = req.params.plugin_params;
    let address = getAddress(did);
    let balance = await this.getSolBalance(did);
    let requiredAmount = parseFloat(this.min_amount);
    let isValid = false;
    if(balance >= requiredAmount) {
        isValid =  true;
    } 

    res.json({
        status: 200,
        address: address,
        balance: balance,
        is_valid: isValid,
        requiredAmount: requiredAmount
    });
  }


  /** Example of an API route returning a simple json object. The routes declared by a plugin are automatically exposed by the OrbisDB instance */
  helloApi(req, res) {
    res.json({
      hello: "world"
    })
  }

  /** Example of an API route returning a simple HTML page. The routes declared by a plugin are automatically exposed by the OrbisDB instance */
  helloHtmlApi(req, res) {
    res.send(`<!DOCTYPE html>
      <html>
        <head>
          <title>Simple Page</title>
        </head>
        <body>
          <h1>Hello, this is a simple HTML page</h1>
          <p>More content here...</p>
        </body>
      </html>`);
  }
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
  console.log("In parts:", parts);
  
  // Return the last element of the array
  return parts[parts.length - 1];
}

