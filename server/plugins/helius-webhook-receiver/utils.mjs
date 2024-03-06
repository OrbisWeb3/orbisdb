import { DriftInterface } from "./interfaces/drift.mjs";
  
export const solPrograms = {
    "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH": {
        name: "Drift Protocol V2",
        slug: "drift-v2",
        protocol: "drift",
        interface: new DriftInterface()
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