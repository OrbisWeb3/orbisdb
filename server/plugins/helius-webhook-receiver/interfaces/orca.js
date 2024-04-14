export class OrcaInterface {
  idl = idl;

  /** Will clean drift transaction */
  clean(data) {
    let obj = data;
    const newObj = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        switch (key) {
          case "amount":
            newObj[key] = value.toString();
            break;
          case "otherAmountThreshold":
            newObj[key] = value.toString();
            break;
          case "sqrtPriceLimit":
            newObj[key] = value.toString();
            break;
          default:
            newObj[key] = value;
            break;
        }
      }
    }
    return newObj;
  }
}

export const orcaRawTx = [
  {
    blockTime: 1709807656,
    indexWithinBlock: 124,
    meta: {
      err: null,
      fee: 15527,
      innerInstructions: [
        {
          index: 3,
          instructions: [
            {
              accounts: [2, 8, 0],
              data: "3RKgqnEaQg7Z",
              programIdIndex: 12,
            },
            {
              accounts: [1, 5, 6],
              data: "3UYaBS7WpuCB",
              programIdIndex: 12,
            },
          ],
        },
      ],
      loadedAddresses: {
        readonly: [],
        writable: [],
      },
      logMessages: [
        "Program ComputeBudget111111111111111111111111111111 invoke [1]",
        "Program ComputeBudget111111111111111111111111111111 success",
        "Program ComputeBudget111111111111111111111111111111 invoke [1]",
        "Program ComputeBudget111111111111111111111111111111 success",
        "Program 59FguaJypTjiVbZPRGSq8Z78pBa9CGhrrEaeK1s1vnyT invoke [1]",
        "Program log: Instruction: CheckAndUpdate",
        "Program 59FguaJypTjiVbZPRGSq8Z78pBa9CGhrrEaeK1s1vnyT consumed 3559 of 109700 compute units",
        "Program 59FguaJypTjiVbZPRGSq8Z78pBa9CGhrrEaeK1s1vnyT success",
        "Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc invoke [1]",
        "Program log: Instruction: Swap",
        "Program log: fee_growth: 17048993576",
        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
        "Program log: Instruction: Transfer",
        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4736 of 76745 compute units",
        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
        "Program log: Instruction: Transfer",
        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 69092 compute units",
        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
        "Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc consumed 45235 of 106141 compute units",
        "Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc success",
      ],
      postBalances: [
        2901549114, 2039280, 1438501156766, 70407360, 70407360, 2039280,
        5435761, 1224960, 262117263108, 0, 70407360, 1, 934087680, 1141440,
        1141440,
      ],
      postTokenBalances: [
        {
          accountIndex: 1,
          mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          owner: "Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE",
          programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          uiTokenAmount: {
            amount: "122787294081",
            decimals: 6,
            uiAmount: 122787.3,
            uiAmountString: "122787.294081",
          },
        },
        {
          accountIndex: 2,
          mint: "So11111111111111111111111111111111111111112",
          owner: "9vu7XMz8Brmfm4mT1T2E1YzemsUCwQEzeM3DrocPBxWc",
          programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          uiTokenAmount: {
            amount: "1438499117486",
            decimals: 9,
            uiAmount: 1438.4991,
            uiAmountString: "1438.499117486",
          },
        },
        {
          accountIndex: 5,
          mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          owner: "9vu7XMz8Brmfm4mT1T2E1YzemsUCwQEzeM3DrocPBxWc",
          programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          uiTokenAmount: {
            amount: "124906965507",
            decimals: 6,
            uiAmount: 124906.97,
            uiAmountString: "124906.965507",
          },
        },
        {
          accountIndex: 8,
          mint: "So11111111111111111111111111111111111111112",
          owner: "Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE",
          programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          uiTokenAmount: {
            amount: "261925171465",
            decimals: 9,
            uiAmount: 261.92517,
            uiAmountString: "261.925171465",
          },
        },
      ],
      preBalances: [
        2901564641, 2039280, 1438509213156, 70407360, 70407360, 2039280,
        5435761, 1224960, 262109206718, 0, 70407360, 1, 934087680, 1141440,
        1141440,
      ],
      preTokenBalances: [
        {
          accountIndex: 1,
          mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          owner: "Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE",
          programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          uiTokenAmount: {
            amount: "122788421083",
            decimals: 6,
            uiAmount: 122788.42,
            uiAmountString: "122788.421083",
          },
        },
        {
          accountIndex: 2,
          mint: "So11111111111111111111111111111111111111112",
          owner: "9vu7XMz8Brmfm4mT1T2E1YzemsUCwQEzeM3DrocPBxWc",
          programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          uiTokenAmount: {
            amount: "1438507173876",
            decimals: 9,
            uiAmount: 1438.5072,
            uiAmountString: "1438.507173876",
          },
        },
        {
          accountIndex: 5,
          mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          owner: "9vu7XMz8Brmfm4mT1T2E1YzemsUCwQEzeM3DrocPBxWc",
          programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          uiTokenAmount: {
            amount: "124905838505",
            decimals: 6,
            uiAmount: 124905.836,
            uiAmountString: "124905.838505",
          },
        },
        {
          accountIndex: 8,
          mint: "So11111111111111111111111111111111111111112",
          owner: "Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE",
          programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          uiTokenAmount: {
            amount: "261917115075",
            decimals: 9,
            uiAmount: 261.9171,
            uiAmountString: "261.917115075",
          },
        },
      ],
      rewards: [],
    },
    slot: 252648532,
    transaction: {
      message: {
        accountKeys: [
          "9vu7XMz8Brmfm4mT1T2E1YzemsUCwQEzeM3DrocPBxWc",
          "2WLWEuKDgkDUccTpbwYp1GToYktiSB1cXvreHUwiSUVP",
          "7exzsvjn46jweUp1uerS3SYMmHUdQcBgrQi2MHMv5fJV",
          "8Yoy9SqpLRV1UkLiTkMkNqnuE1bcSAFiYC8jMjS7Niqp",
          "8bnKeevCLsmbudhjkwg6GFMcsZpf78cs8pzRxzMqwZLa",
          "BkJFS1HF6JgrsB1VXdTVMsZ7R6WCKqokCqhUZqarPPVZ",
          "Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE",
          "EG8fySEhqMrxwzbLudCAjVhpqMrnFFUxRVvBLrMuCCd6",
          "EUuUbDcafPrmVTD5M6qoJAoyyNbihBhugADAxRMn5he9",
          "FoKYKtRpD25TKzBMndysKpgPqbj8AdLXjfpYHXn9PGTX",
          "HKFHvjsaXWqm5eJpP6minENF6EDK4r86d7G3oYfqD4Q8",
          "ComputeBudget111111111111111111111111111111",
          "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
          "59FguaJypTjiVbZPRGSq8Z78pBa9CGhrrEaeK1s1vnyT",
        ],
        addressTableLookups: null,
        header: {
          numReadonlySignedAccounts: 0,
          numReadonlyUnsignedAccounts: 4,
          numRequiredSignatures: 1,
        },
        instructions: [
          {
            accounts: [],
            data: "JbzbGj",
            programIdIndex: 11,
          },
          {
            accounts: [],
            data: "3pzfNMnn7cfR",
            programIdIndex: 11,
          },
          {
            accounts: [7, 0],
            data: "4fqBdVvMsQe1WGg6DBXq43",
            programIdIndex: 14,
          },
          {
            accounts: [12, 0, 6, 2, 8, 5, 1, 4, 3, 10, 9],
            data: "59p8WydnSZtTVbfL3VnJpqBTs9HGRJdZHXrirEfx7kH4T4d9rwjw5kL5fn",
            programIdIndex: 13,
          },
        ],
        recentBlockhash: "AE14S4LJPR4GCSd6c9FAuKiW24JL5BwHnNomn9coLc8",
      },
      signatures: [
        "3a6KL25Pi7LKDMCcF7eaSXTtvJu1bGe6XyYU1Fd9umAdSsgL1gGimof2JZD5KeJynUSpruFzipTgB7tkjmfyjiw",
      ],
    },
    version: "legacy",
  },
];

export const idl = {
  version: "0.2.0",
  name: "whirlpool",
  instructions: [
    {
      name: "initializeConfig",
      accounts: [
        {
          name: "config",
          isMut: true,
          isSigner: true,
        },
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "feeAuthority",
          type: "publicKey",
        },
        {
          name: "collectProtocolFeesAuthority",
          type: "publicKey",
        },
        {
          name: "rewardEmissionsSuperAuthority",
          type: "publicKey",
        },
        {
          name: "defaultProtocolFeeRate",
          type: "u16",
        },
      ],
    },
    {
      name: "initializePool",
      accounts: [
        {
          name: "whirlpoolsConfig",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenMintA",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenMintB",
          isMut: false,
          isSigner: false,
        },
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "whirlpool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultA",
          isMut: true,
          isSigner: true,
        },
        {
          name: "tokenVaultB",
          isMut: true,
          isSigner: true,
        },
        {
          name: "feeTier",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "bumps",
          type: {
            defined: "WhirlpoolBumps",
          },
        },
        {
          name: "tickSpacing",
          type: "u16",
        },
        {
          name: "initialSqrtPrice",
          type: "u128",
        },
      ],
    },
    {
      name: "initializeTickArray",
      accounts: [
        {
          name: "whirlpool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "tickArray",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "startTickIndex",
          type: "i32",
        },
      ],
    },
    {
      name: "initializeFeeTier",
      accounts: [
        {
          name: "config",
          isMut: false,
          isSigner: false,
        },
        {
          name: "feeTier",
          isMut: true,
          isSigner: false,
        },
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "feeAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "tickSpacing",
          type: "u16",
        },
        {
          name: "defaultFeeRate",
          type: "u16",
        },
      ],
    },
    {
      name: "initializeReward",
      accounts: [
        {
          name: "rewardAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "whirlpool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rewardVault",
          isMut: true,
          isSigner: true,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "rewardIndex",
          type: "u8",
        },
      ],
    },
    {
      name: "setRewardEmissions",
      accounts: [
        {
          name: "whirlpool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "rewardVault",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "rewardIndex",
          type: "u8",
        },
        {
          name: "emissionsPerSecondX64",
          type: "u128",
        },
      ],
    },
    {
      name: "openPosition",
      accounts: [
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "owner",
          isMut: false,
          isSigner: false,
        },
        {
          name: "position",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionMint",
          isMut: true,
          isSigner: true,
        },
        {
          name: "positionTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "whirlpool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "bumps",
          type: {
            defined: "OpenPositionBumps",
          },
        },
        {
          name: "tickLowerIndex",
          type: "i32",
        },
        {
          name: "tickUpperIndex",
          type: "i32",
        },
      ],
    },
    {
      name: "openPositionWithMetadata",
      accounts: [
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "owner",
          isMut: false,
          isSigner: false,
        },
        {
          name: "position",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionMint",
          isMut: true,
          isSigner: true,
        },
        {
          name: "positionMetadataAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "whirlpool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "metadataProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "metadataUpdateAuth",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "bumps",
          type: {
            defined: "OpenPositionWithMetadataBumps",
          },
        },
        {
          name: "tickLowerIndex",
          type: "i32",
        },
        {
          name: "tickUpperIndex",
          type: "i32",
        },
      ],
    },
    {
      name: "increaseLiquidity",
      accounts: [
        {
          name: "whirlpool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "positionAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "position",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionTokenAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayLower",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayUpper",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "liquidityAmount",
          type: "u128",
        },
        {
          name: "tokenMaxA",
          type: "u64",
        },
        {
          name: "tokenMaxB",
          type: "u64",
        },
      ],
    },
    {
      name: "decreaseLiquidity",
      accounts: [
        {
          name: "whirlpool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "positionAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "position",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionTokenAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayLower",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayUpper",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "liquidityAmount",
          type: "u128",
        },
        {
          name: "tokenMinA",
          type: "u64",
        },
        {
          name: "tokenMinB",
          type: "u64",
        },
      ],
    },
    {
      name: "updateFeesAndRewards",
      accounts: [
        {
          name: "whirlpool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "position",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayLower",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tickArrayUpper",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "collectFees",
      accounts: [
        {
          name: "whirlpool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "positionAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "position",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionTokenAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "collectReward",
      accounts: [
        {
          name: "whirlpool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "positionAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "position",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionTokenAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rewardOwnerAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "rewardIndex",
          type: "u8",
        },
      ],
    },
    {
      name: "collectProtocolFees",
      accounts: [
        {
          name: "whirlpoolsConfig",
          isMut: false,
          isSigner: false,
        },
        {
          name: "whirlpool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "collectProtocolFeesAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "tokenVaultA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenDestinationA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenDestinationB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "swap",
      accounts: [
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "whirlpool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArray0",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArray1",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArray2",
          isMut: true,
          isSigner: false,
        },
        {
          name: "oracle",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
        {
          name: "otherAmountThreshold",
          type: "u64",
        },
        {
          name: "sqrtPriceLimit",
          type: "u128",
        },
        {
          name: "amountSpecifiedIsInput",
          type: "bool",
        },
        {
          name: "aToB",
          type: "bool",
        },
      ],
    },
    {
      name: "closePosition",
      accounts: [
        {
          name: "positionAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "receiver",
          isMut: true,
          isSigner: false,
        },
        {
          name: "position",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "setDefaultFeeRate",
      accounts: [
        {
          name: "whirlpoolsConfig",
          isMut: false,
          isSigner: false,
        },
        {
          name: "feeTier",
          isMut: true,
          isSigner: false,
        },
        {
          name: "feeAuthority",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "defaultFeeRate",
          type: "u16",
        },
      ],
    },
    {
      name: "setDefaultProtocolFeeRate",
      accounts: [
        {
          name: "whirlpoolsConfig",
          isMut: true,
          isSigner: false,
        },
        {
          name: "feeAuthority",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "defaultProtocolFeeRate",
          type: "u16",
        },
      ],
    },
    {
      name: "setFeeRate",
      accounts: [
        {
          name: "whirlpoolsConfig",
          isMut: false,
          isSigner: false,
        },
        {
          name: "whirlpool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "feeAuthority",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "feeRate",
          type: "u16",
        },
      ],
    },
    {
      name: "setProtocolFeeRate",
      accounts: [
        {
          name: "whirlpoolsConfig",
          isMut: false,
          isSigner: false,
        },
        {
          name: "whirlpool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "feeAuthority",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "protocolFeeRate",
          type: "u16",
        },
      ],
    },
    {
      name: "setFeeAuthority",
      accounts: [
        {
          name: "whirlpoolsConfig",
          isMut: true,
          isSigner: false,
        },
        {
          name: "feeAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "newFeeAuthority",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "setCollectProtocolFeesAuthority",
      accounts: [
        {
          name: "whirlpoolsConfig",
          isMut: true,
          isSigner: false,
        },
        {
          name: "collectProtocolFeesAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "newCollectProtocolFeesAuthority",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "setRewardAuthority",
      accounts: [
        {
          name: "whirlpool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "newRewardAuthority",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "rewardIndex",
          type: "u8",
        },
      ],
    },
    {
      name: "setRewardAuthorityBySuperAuthority",
      accounts: [
        {
          name: "whirlpoolsConfig",
          isMut: false,
          isSigner: false,
        },
        {
          name: "whirlpool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardEmissionsSuperAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "newRewardAuthority",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "rewardIndex",
          type: "u8",
        },
      ],
    },
    {
      name: "setRewardEmissionsSuperAuthority",
      accounts: [
        {
          name: "whirlpoolsConfig",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardEmissionsSuperAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "newRewardEmissionsSuperAuthority",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "twoHopSwap",
      accounts: [
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "whirlpoolOne",
          isMut: true,
          isSigner: false,
        },
        {
          name: "whirlpoolTwo",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountOneA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultOneA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountOneB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultOneB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountTwoA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultTwoA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountTwoB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultTwoB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayOne0",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayOne1",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayOne2",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayTwo0",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayTwo1",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayTwo2",
          isMut: true,
          isSigner: false,
        },
        {
          name: "oracleOne",
          isMut: false,
          isSigner: false,
        },
        {
          name: "oracleTwo",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
        {
          name: "otherAmountThreshold",
          type: "u64",
        },
        {
          name: "amountSpecifiedIsInput",
          type: "bool",
        },
        {
          name: "aToBOne",
          type: "bool",
        },
        {
          name: "aToBTwo",
          type: "bool",
        },
        {
          name: "sqrtPriceLimitOne",
          type: "u128",
        },
        {
          name: "sqrtPriceLimitTwo",
          type: "u128",
        },
      ],
    },
    {
      name: "initializePositionBundle",
      accounts: [
        {
          name: "positionBundle",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundleMint",
          isMut: true,
          isSigner: true,
        },
        {
          name: "positionBundleTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundleOwner",
          isMut: false,
          isSigner: false,
        },
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "initializePositionBundleWithMetadata",
      accounts: [
        {
          name: "positionBundle",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundleMint",
          isMut: true,
          isSigner: true,
        },
        {
          name: "positionBundleMetadata",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundleTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundleOwner",
          isMut: false,
          isSigner: false,
        },
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "metadataUpdateAuth",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "metadataProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "deletePositionBundle",
      accounts: [
        {
          name: "positionBundle",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundleMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundleTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundleOwner",
          isMut: false,
          isSigner: true,
        },
        {
          name: "receiver",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "openBundledPosition",
      accounts: [
        {
          name: "bundledPosition",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundle",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundleTokenAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "positionBundleAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "whirlpool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "bundleIndex",
          type: "u16",
        },
        {
          name: "tickLowerIndex",
          type: "i32",
        },
        {
          name: "tickUpperIndex",
          type: "i32",
        },
      ],
    },
    {
      name: "closeBundledPosition",
      accounts: [
        {
          name: "bundledPosition",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundle",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundleTokenAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "positionBundleAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "receiver",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "bundleIndex",
          type: "u16",
        },
      ],
    },
  ],
  accounts: [
    {
      name: "WhirlpoolsConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "feeAuthority",
            type: "publicKey",
          },
          {
            name: "collectProtocolFeesAuthority",
            type: "publicKey",
          },
          {
            name: "rewardEmissionsSuperAuthority",
            type: "publicKey",
          },
          {
            name: "defaultProtocolFeeRate",
            type: "u16",
          },
        ],
      },
    },
    {
      name: "FeeTier",
      type: {
        kind: "struct",
        fields: [
          {
            name: "whirlpoolsConfig",
            type: "publicKey",
          },
          {
            name: "tickSpacing",
            type: "u16",
          },
          {
            name: "defaultFeeRate",
            type: "u16",
          },
        ],
      },
    },
    {
      name: "PositionBundle",
      type: {
        kind: "struct",
        fields: [
          {
            name: "positionBundleMint",
            type: "publicKey",
          },
          {
            name: "positionBitmap",
            type: {
              array: ["u8", 32],
            },
          },
        ],
      },
    },
    {
      name: "Position",
      type: {
        kind: "struct",
        fields: [
          {
            name: "whirlpool",
            type: "publicKey",
          },
          {
            name: "positionMint",
            type: "publicKey",
          },
          {
            name: "liquidity",
            type: "u128",
          },
          {
            name: "tickLowerIndex",
            type: "i32",
          },
          {
            name: "tickUpperIndex",
            type: "i32",
          },
          {
            name: "feeGrowthCheckpointA",
            type: "u128",
          },
          {
            name: "feeOwedA",
            type: "u64",
          },
          {
            name: "feeGrowthCheckpointB",
            type: "u128",
          },
          {
            name: "feeOwedB",
            type: "u64",
          },
          {
            name: "rewardInfos",
            type: {
              array: [
                {
                  defined: "PositionRewardInfo",
                },
                3,
              ],
            },
          },
        ],
      },
    },
    {
      name: "TickArray",
      type: {
        kind: "struct",
        fields: [
          {
            name: "startTickIndex",
            type: "i32",
          },
          {
            name: "ticks",
            type: {
              array: [
                {
                  defined: "Tick",
                },
                88,
              ],
            },
          },
          {
            name: "whirlpool",
            type: "publicKey",
          },
        ],
      },
    },
    {
      name: "Whirlpool",
      type: {
        kind: "struct",
        fields: [
          {
            name: "whirlpoolsConfig",
            type: "publicKey",
          },
          {
            name: "whirlpoolBump",
            type: {
              array: ["u8", 1],
            },
          },
          {
            name: "tickSpacing",
            type: "u16",
          },
          {
            name: "tickSpacingSeed",
            type: {
              array: ["u8", 2],
            },
          },
          {
            name: "feeRate",
            type: "u16",
          },
          {
            name: "protocolFeeRate",
            type: "u16",
          },
          {
            name: "liquidity",
            type: "u128",
          },
          {
            name: "sqrtPrice",
            type: "u128",
          },
          {
            name: "tickCurrentIndex",
            type: "i32",
          },
          {
            name: "protocolFeeOwedA",
            type: "u64",
          },
          {
            name: "protocolFeeOwedB",
            type: "u64",
          },
          {
            name: "tokenMintA",
            type: "publicKey",
          },
          {
            name: "tokenVaultA",
            type: "publicKey",
          },
          {
            name: "feeGrowthGlobalA",
            type: "u128",
          },
          {
            name: "tokenMintB",
            type: "publicKey",
          },
          {
            name: "tokenVaultB",
            type: "publicKey",
          },
          {
            name: "feeGrowthGlobalB",
            type: "u128",
          },
          {
            name: "rewardLastUpdatedTimestamp",
            type: "u64",
          },
          {
            name: "rewardInfos",
            type: {
              array: [
                {
                  defined: "WhirlpoolRewardInfo",
                },
                3,
              ],
            },
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "OpenPositionBumps",
      type: {
        kind: "struct",
        fields: [
          {
            name: "positionBump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "OpenPositionWithMetadataBumps",
      type: {
        kind: "struct",
        fields: [
          {
            name: "positionBump",
            type: "u8",
          },
          {
            name: "metadataBump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "PositionRewardInfo",
      type: {
        kind: "struct",
        fields: [
          {
            name: "growthInsideCheckpoint",
            type: "u128",
          },
          {
            name: "amountOwed",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "Tick",
      type: {
        kind: "struct",
        fields: [
          {
            name: "initialized",
            type: "bool",
          },
          {
            name: "liquidityNet",
            type: "i128",
          },
          {
            name: "liquidityGross",
            type: "u128",
          },
          {
            name: "feeGrowthOutsideA",
            type: "u128",
          },
          {
            name: "feeGrowthOutsideB",
            type: "u128",
          },
          {
            name: "rewardGrowthsOutside",
            type: {
              array: ["u128", 3],
            },
          },
        ],
      },
    },
    {
      name: "WhirlpoolRewardInfo",
      type: {
        kind: "struct",
        fields: [
          {
            name: "mint",
            type: "publicKey",
          },
          {
            name: "vault",
            type: "publicKey",
          },
          {
            name: "authority",
            type: "publicKey",
          },
          {
            name: "emissionsPerSecondX64",
            type: "u128",
          },
          {
            name: "growthGlobalX64",
            type: "u128",
          },
        ],
      },
    },
    {
      name: "WhirlpoolBumps",
      type: {
        kind: "struct",
        fields: [
          {
            name: "whirlpoolBump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "CurrIndex",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Below",
          },
          {
            name: "Inside",
          },
          {
            name: "Above",
          },
        ],
      },
    },
    {
      name: "TickLabel",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Upper",
          },
          {
            name: "Lower",
          },
        ],
      },
    },
    {
      name: "Direction",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Left",
          },
          {
            name: "Right",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "InvalidEnum",
      msg: "Enum value could not be converted",
    },
    {
      code: 6001,
      name: "InvalidStartTick",
      msg: "Invalid start tick index provided.",
    },
    {
      code: 6002,
      name: "TickArrayExistInPool",
      msg: "Tick-array already exists in this whirlpool",
    },
    {
      code: 6003,
      name: "TickArrayIndexOutofBounds",
      msg: "Attempt to search for a tick-array failed",
    },
    {
      code: 6004,
      name: "InvalidTickSpacing",
      msg: "Tick-spacing is not supported",
    },
    {
      code: 6005,
      name: "ClosePositionNotEmpty",
      msg: "Position is not empty It cannot be closed",
    },
    {
      code: 6006,
      name: "DivideByZero",
      msg: "Unable to divide by zero",
    },
    {
      code: 6007,
      name: "NumberCastError",
      msg: "Unable to cast number into BigInt",
    },
    {
      code: 6008,
      name: "NumberDownCastError",
      msg: "Unable to down cast number",
    },
    {
      code: 6009,
      name: "TickNotFound",
      msg: "Tick not found within tick array",
    },
    {
      code: 6010,
      name: "InvalidTickIndex",
      msg: "Provided tick index is either out of bounds or uninitializable",
    },
    {
      code: 6011,
      name: "SqrtPriceOutOfBounds",
      msg: "Provided sqrt price out of bounds",
    },
    {
      code: 6012,
      name: "LiquidityZero",
      msg: "Liquidity amount must be greater than zero",
    },
    {
      code: 6013,
      name: "LiquidityTooHigh",
      msg: "Liquidity amount must be less than i64::MAX",
    },
    {
      code: 6014,
      name: "LiquidityOverflow",
      msg: "Liquidity overflow",
    },
    {
      code: 6015,
      name: "LiquidityUnderflow",
      msg: "Liquidity underflow",
    },
    {
      code: 6016,
      name: "LiquidityNetError",
      msg: "Tick liquidity net underflowed or overflowed",
    },
    {
      code: 6017,
      name: "TokenMaxExceeded",
      msg: "Exceeded token max",
    },
    {
      code: 6018,
      name: "TokenMinSubceeded",
      msg: "Did not meet token min",
    },
    {
      code: 6019,
      name: "MissingOrInvalidDelegate",
      msg: "Position token account has a missing or invalid delegate",
    },
    {
      code: 6020,
      name: "InvalidPositionTokenAmount",
      msg: "Position token amount must be 1",
    },
    {
      code: 6021,
      name: "InvalidTimestampConversion",
      msg: "Timestamp should be convertible from i64 to u64",
    },
    {
      code: 6022,
      name: "InvalidTimestamp",
      msg: "Timestamp should be greater than the last updated timestamp",
    },
    {
      code: 6023,
      name: "InvalidTickArraySequence",
      msg: "Invalid tick array sequence provided for instruction.",
    },
    {
      code: 6024,
      name: "InvalidTokenMintOrder",
      msg: "Token Mint in wrong order",
    },
    {
      code: 6025,
      name: "RewardNotInitialized",
      msg: "Reward not initialized",
    },
    {
      code: 6026,
      name: "InvalidRewardIndex",
      msg: "Invalid reward index",
    },
    {
      code: 6027,
      name: "RewardVaultAmountInsufficient",
      msg: "Reward vault requires amount to support emissions for at least one day",
    },
    {
      code: 6028,
      name: "FeeRateMaxExceeded",
      msg: "Exceeded max fee rate",
    },
    {
      code: 6029,
      name: "ProtocolFeeRateMaxExceeded",
      msg: "Exceeded max protocol fee rate",
    },
    {
      code: 6030,
      name: "MultiplicationShiftRightOverflow",
      msg: "Multiplication with shift right overflow",
    },
    {
      code: 6031,
      name: "MulDivOverflow",
      msg: "Muldiv overflow",
    },
    {
      code: 6032,
      name: "MulDivInvalidInput",
      msg: "Invalid div_u256 input",
    },
    {
      code: 6033,
      name: "MultiplicationOverflow",
      msg: "Multiplication overflow",
    },
    {
      code: 6034,
      name: "InvalidSqrtPriceLimitDirection",
      msg: "Provided SqrtPriceLimit not in the same direction as the swap.",
    },
    {
      code: 6035,
      name: "ZeroTradableAmount",
      msg: "There are no tradable amount to swap.",
    },
    {
      code: 6036,
      name: "AmountOutBelowMinimum",
      msg: "Amount out below minimum threshold",
    },
    {
      code: 6037,
      name: "AmountInAboveMaximum",
      msg: "Amount in above maximum threshold",
    },
    {
      code: 6038,
      name: "TickArraySequenceInvalidIndex",
      msg: "Invalid index for tick array sequence",
    },
    {
      code: 6039,
      name: "AmountCalcOverflow",
      msg: "Amount calculated overflows",
    },
    {
      code: 6040,
      name: "AmountRemainingOverflow",
      msg: "Amount remaining overflows",
    },
    {
      code: 6041,
      name: "InvalidIntermediaryMint",
      msg: "Invalid intermediary mint",
    },
    {
      code: 6042,
      name: "DuplicateTwoHopPool",
      msg: "Duplicate two hop pool",
    },
    {
      code: 6043,
      name: "InvalidBundleIndex",
      msg: "Bundle index is out of bounds",
    },
    {
      code: 6044,
      name: "BundledPositionAlreadyOpened",
      msg: "Position has already been opened",
    },
    {
      code: 6045,
      name: "BundledPositionAlreadyClosed",
      msg: "Position has already been closed",
    },
    {
      code: 6046,
      name: "PositionBundleNotDeletable",
      msg: "Unable to delete PositionBundle with open positions",
    },
  ],
};
