export class JupiterInterface {
    idl = idl;
    
    /** Will clean drift transaction */
    clean(obj) {
        const newObj = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                switch(key) {
                    case "inAmount":
                        newObj[key] = value.toString();
                        break;

                    case "quotedOutAmount":
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

export const idl = {
    "version": "0.1.0",
    "name": "jupiter",
    "instructions": [
      {
        "name": "route",
        "docs": [
          "route_plan Topologically sorted trade DAG"
        ],
        "accounts": [
          {
            "name": "tokenProgram",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "userTransferAuthority",
            "isMut": false,
            "isSigner": true
          },
          {
            "name": "userSourceTokenAccount",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "userDestinationTokenAccount",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "destinationTokenAccount",
            "isMut": false,
            "isSigner": false,
            "isOptional": true
          },
          {
            "name": "destinationMint",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "platformFeeAccount",
            "isMut": true,
            "isSigner": false,
            "isOptional": true
          },
          {
            "name": "eventAuthority",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "program",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": [
          {
            "name": "routePlan",
            "type": {
              "vec": {
                "defined": "RoutePlanStep"
              }
            }
          },
          {
            "name": "inAmount",
            "type": "u64"
          },
          {
            "name": "quotedOutAmount",
            "type": "u64"
          },
          {
            "name": "slippageBps",
            "type": "u16"
          },
          {
            "name": "platformFeeBps",
            "type": "u8"
          }
        ],
        "returns": "u64"
      },
      {
        "name": "routeWithTokenLedger",
        "accounts": [
          {
            "name": "tokenProgram",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "userTransferAuthority",
            "isMut": false,
            "isSigner": true
          },
          {
            "name": "userSourceTokenAccount",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "userDestinationTokenAccount",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "destinationTokenAccount",
            "isMut": false,
            "isSigner": false,
            "isOptional": true
          },
          {
            "name": "destinationMint",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "platformFeeAccount",
            "isMut": true,
            "isSigner": false,
            "isOptional": true
          },
          {
            "name": "tokenLedger",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "eventAuthority",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "program",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": [
          {
            "name": "routePlan",
            "type": {
              "vec": {
                "defined": "RoutePlanStep"
              }
            }
          },
          {
            "name": "quotedOutAmount",
            "type": "u64"
          },
          {
            "name": "slippageBps",
            "type": "u16"
          },
          {
            "name": "platformFeeBps",
            "type": "u8"
          }
        ],
        "returns": "u64"
      },
      {
        "name": "sharedAccountsRoute",
        "docs": [
          "Route by using program owned token accounts and open orders accounts."
        ],
        "accounts": [
          {
            "name": "tokenProgram",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "programAuthority",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "userTransferAuthority",
            "isMut": false,
            "isSigner": true
          },
          {
            "name": "sourceTokenAccount",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "programSourceTokenAccount",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "programDestinationTokenAccount",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "destinationTokenAccount",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "sourceMint",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "destinationMint",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "platformFeeAccount",
            "isMut": true,
            "isSigner": false,
            "isOptional": true
          },
          {
            "name": "token2022Program",
            "isMut": false,
            "isSigner": false,
            "isOptional": true
          },
          {
            "name": "eventAuthority",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "program",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": [
          {
            "name": "id",
            "type": "u8"
          },
          {
            "name": "routePlan",
            "type": {
              "vec": {
                "defined": "RoutePlanStep"
              }
            }
          },
          {
            "name": "inAmount",
            "type": "u64"
          },
          {
            "name": "quotedOutAmount",
            "type": "u64"
          },
          {
            "name": "slippageBps",
            "type": "u16"
          },
          {
            "name": "platformFeeBps",
            "type": "u8"
          }
        ],
        "returns": "u64"
      },
      {
        "name": "sharedAccountsRouteWithTokenLedger",
        "accounts": [
          {
            "name": "tokenProgram",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "programAuthority",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "userTransferAuthority",
            "isMut": false,
            "isSigner": true
          },
          {
            "name": "sourceTokenAccount",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "programSourceTokenAccount",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "programDestinationTokenAccount",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "destinationTokenAccount",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "sourceMint",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "destinationMint",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "platformFeeAccount",
            "isMut": true,
            "isSigner": false,
            "isOptional": true
          },
          {
            "name": "token2022Program",
            "isMut": false,
            "isSigner": false,
            "isOptional": true
          },
          {
            "name": "tokenLedger",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "eventAuthority",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "program",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": [
          {
            "name": "id",
            "type": "u8"
          },
          {
            "name": "routePlan",
            "type": {
              "vec": {
                "defined": "RoutePlanStep"
              }
            }
          },
          {
            "name": "quotedOutAmount",
            "type": "u64"
          },
          {
            "name": "slippageBps",
            "type": "u16"
          },
          {
            "name": "platformFeeBps",
            "type": "u8"
          }
        ],
        "returns": "u64"
      },
      {
        "name": "exactOutRoute",
        "accounts": [
          {
            "name": "tokenProgram",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "userTransferAuthority",
            "isMut": false,
            "isSigner": true
          },
          {
            "name": "userSourceTokenAccount",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "userDestinationTokenAccount",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "destinationTokenAccount",
            "isMut": false,
            "isSigner": false,
            "isOptional": true
          },
          {
            "name": "sourceMint",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "destinationMint",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "platformFeeAccount",
            "isMut": true,
            "isSigner": false,
            "isOptional": true
          },
          {
            "name": "token2022Program",
            "isMut": false,
            "isSigner": false,
            "isOptional": true
          },
          {
            "name": "eventAuthority",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "program",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": [
          {
            "name": "routePlan",
            "type": {
              "vec": {
                "defined": "RoutePlanStep"
              }
            }
          },
          {
            "name": "outAmount",
            "type": "u64"
          },
          {
            "name": "quotedInAmount",
            "type": "u64"
          },
          {
            "name": "slippageBps",
            "type": "u16"
          },
          {
            "name": "platformFeeBps",
            "type": "u8"
          }
        ],
        "returns": "u64"
      },
      {
        "name": "sharedAccountsExactOutRoute",
        "docs": [
          "Route by using program owned token accounts and open orders accounts."
        ],
        "accounts": [
          {
            "name": "tokenProgram",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "programAuthority",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "userTransferAuthority",
            "isMut": false,
            "isSigner": true
          },
          {
            "name": "sourceTokenAccount",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "programSourceTokenAccount",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "programDestinationTokenAccount",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "destinationTokenAccount",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "sourceMint",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "destinationMint",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "platformFeeAccount",
            "isMut": true,
            "isSigner": false,
            "isOptional": true
          },
          {
            "name": "token2022Program",
            "isMut": false,
            "isSigner": false,
            "isOptional": true
          },
          {
            "name": "eventAuthority",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "program",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": [
          {
            "name": "id",
            "type": "u8"
          },
          {
            "name": "routePlan",
            "type": {
              "vec": {
                "defined": "RoutePlanStep"
              }
            }
          },
          {
            "name": "outAmount",
            "type": "u64"
          },
          {
            "name": "quotedInAmount",
            "type": "u64"
          },
          {
            "name": "slippageBps",
            "type": "u16"
          },
          {
            "name": "platformFeeBps",
            "type": "u8"
          }
        ],
        "returns": "u64"
      },
      {
        "name": "setTokenLedger",
        "accounts": [
          {
            "name": "tokenLedger",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "tokenAccount",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": []
      },
      {
        "name": "createOpenOrders",
        "accounts": [
          {
            "name": "openOrders",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "payer",
            "isMut": true,
            "isSigner": true
          },
          {
            "name": "dexProgram",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "systemProgram",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "rent",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "market",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": []
      },
      {
        "name": "createProgramOpenOrders",
        "accounts": [
          {
            "name": "openOrders",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "payer",
            "isMut": true,
            "isSigner": true
          },
          {
            "name": "programAuthority",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "dexProgram",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "systemProgram",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "rent",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "market",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": [
          {
            "name": "id",
            "type": "u8"
          }
        ]
      },
      {
        "name": "claim",
        "accounts": [
          {
            "name": "wallet",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "programAuthority",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "systemProgram",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": [
          {
            "name": "id",
            "type": "u8"
          }
        ],
        "returns": "u64"
      },
      {
        "name": "claimToken",
        "accounts": [
          {
            "name": "payer",
            "isMut": true,
            "isSigner": true
          },
          {
            "name": "wallet",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "programAuthority",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "programTokenAccount",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "destinationTokenAccount",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "mint",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "associatedTokenTokenProgram",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "associatedTokenProgram",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "systemProgram",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": [
          {
            "name": "id",
            "type": "u8"
          }
        ],
        "returns": "u64"
      },
      {
        "name": "createTokenLedger",
        "accounts": [
          {
            "name": "tokenLedger",
            "isMut": true,
            "isSigner": true
          },
          {
            "name": "payer",
            "isMut": true,
            "isSigner": true
          },
          {
            "name": "systemProgram",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": []
      }
    ],
    "accounts": [
      {
        "name": "TokenLedger",
        "type": {
          "kind": "struct",
          "fields": [
            {
              "name": "tokenAccount",
              "type": "publicKey"
            },
            {
              "name": "amount",
              "type": "u64"
            }
          ]
        }
      }
    ],
    "types": [
      {
        "name": "AmountWithSlippage",
        "type": {
          "kind": "struct",
          "fields": [
            {
              "name": "amount",
              "type": "u64"
            },
            {
              "name": "slippageBps",
              "type": "u16"
            }
          ]
        }
      },
      {
        "name": "RoutePlanStep",
        "type": {
          "kind": "struct",
          "fields": [
            {
              "name": "swap",
              "type": {
                "defined": "Swap"
              }
            },
            {
              "name": "percent",
              "type": "u8"
            },
            {
              "name": "inputIndex",
              "type": "u8"
            },
            {
              "name": "outputIndex",
              "type": "u8"
            }
          ]
        }
      },
      {
        "name": "Side",
        "type": {
          "kind": "enum",
          "variants": [
            {
              "name": "Bid"
            },
            {
              "name": "Ask"
            }
          ]
        }
      },
      {
        "name": "Swap",
        "type": {
          "kind": "enum",
          "variants": [
            {
              "name": "Saber"
            },
            {
              "name": "SaberAddDecimalsDeposit"
            },
            {
              "name": "SaberAddDecimalsWithdraw"
            },
            {
              "name": "TokenSwap"
            },
            {
              "name": "Sencha"
            },
            {
              "name": "Step"
            },
            {
              "name": "Cropper"
            },
            {
              "name": "Raydium"
            },
            {
              "name": "Crema",
              "fields": [
                {
                  "name": "a_to_b",
                  "type": "bool"
                }
              ]
            },
            {
              "name": "Lifinity"
            },
            {
              "name": "Mercurial"
            },
            {
              "name": "Cykura"
            },
            {
              "name": "Serum",
              "fields": [
                {
                  "name": "side",
                  "type": {
                    "defined": "Side"
                  }
                }
              ]
            },
            {
              "name": "MarinadeDeposit"
            },
            {
              "name": "MarinadeUnstake"
            },
            {
              "name": "Aldrin",
              "fields": [
                {
                  "name": "side",
                  "type": {
                    "defined": "Side"
                  }
                }
              ]
            },
            {
              "name": "AldrinV2",
              "fields": [
                {
                  "name": "side",
                  "type": {
                    "defined": "Side"
                  }
                }
              ]
            },
            {
              "name": "Whirlpool",
              "fields": [
                {
                  "name": "a_to_b",
                  "type": "bool"
                }
              ]
            },
            {
              "name": "Invariant",
              "fields": [
                {
                  "name": "x_to_y",
                  "type": "bool"
                }
              ]
            },
            {
              "name": "Meteora"
            },
            {
              "name": "GooseFX"
            },
            {
              "name": "DeltaFi",
              "fields": [
                {
                  "name": "stable",
                  "type": "bool"
                }
              ]
            },
            {
              "name": "Balansol"
            },
            {
              "name": "MarcoPolo",
              "fields": [
                {
                  "name": "x_to_y",
                  "type": "bool"
                }
              ]
            },
            {
              "name": "Dradex",
              "fields": [
                {
                  "name": "side",
                  "type": {
                    "defined": "Side"
                  }
                }
              ]
            },
            {
              "name": "LifinityV2"
            },
            {
              "name": "RaydiumClmm"
            },
            {
              "name": "Openbook",
              "fields": [
                {
                  "name": "side",
                  "type": {
                    "defined": "Side"
                  }
                }
              ]
            },
            {
              "name": "Phoenix",
              "fields": [
                {
                  "name": "side",
                  "type": {
                    "defined": "Side"
                  }
                }
              ]
            },
            {
              "name": "Symmetry",
              "fields": [
                {
                  "name": "from_token_id",
                  "type": "u64"
                },
                {
                  "name": "to_token_id",
                  "type": "u64"
                }
              ]
            },
            {
              "name": "TokenSwapV2"
            },
            {
              "name": "HeliumTreasuryManagementRedeemV0"
            },
            {
              "name": "StakeDexStakeWrappedSol"
            },
            {
              "name": "StakeDexSwapViaStake",
              "fields": [
                {
                  "name": "bridge_stake_seed",
                  "type": "u32"
                }
              ]
            },
            {
              "name": "GooseFXV2"
            },
            {
              "name": "Perps"
            },
            {
              "name": "PerpsAddLiquidity"
            },
            {
              "name": "PerpsRemoveLiquidity"
            },
            {
              "name": "MeteoraDlmm"
            },
            {
              "name": "OpenBookV2",
              "fields": [
                {
                  "name": "side",
                  "type": {
                    "defined": "Side"
                  }
                }
              ]
            },
            {
              "name": "RaydiumClmmV2"
            }
          ]
        }
      }
    ],
    "events": [
      {
        "name": "SwapEvent",
        "fields": [
          {
            "name": "amm",
            "type": "publicKey",
            "index": false
          },
          {
            "name": "inputMint",
            "type": "publicKey",
            "index": false
          },
          {
            "name": "inputAmount",
            "type": "u64",
            "index": false
          },
          {
            "name": "outputMint",
            "type": "publicKey",
            "index": false
          },
          {
            "name": "outputAmount",
            "type": "u64",
            "index": false
          }
        ]
      },
      {
        "name": "FeeEvent",
        "fields": [
          {
            "name": "account",
            "type": "publicKey",
            "index": false
          },
          {
            "name": "mint",
            "type": "publicKey",
            "index": false
          },
          {
            "name": "amount",
            "type": "u64",
            "index": false
          }
        ]
      }
    ],
    "errors": [
      {
        "code": 6000,
        "name": "EmptyRoute",
        "msg": "Empty route"
      },
      {
        "code": 6001,
        "name": "SlippageToleranceExceeded",
        "msg": "Slippage tolerance exceeded"
      },
      {
        "code": 6002,
        "name": "InvalidCalculation",
        "msg": "Invalid calculation"
      },
      {
        "code": 6003,
        "name": "MissingPlatformFeeAccount",
        "msg": "Missing platform fee account"
      },
      {
        "code": 6004,
        "name": "InvalidSlippage",
        "msg": "Invalid slippage"
      },
      {
        "code": 6005,
        "name": "NotEnoughPercent",
        "msg": "Not enough percent to 100"
      },
      {
        "code": 6006,
        "name": "InvalidInputIndex",
        "msg": "Token input index is invalid"
      },
      {
        "code": 6007,
        "name": "InvalidOutputIndex",
        "msg": "Token output index is invalid"
      },
      {
        "code": 6008,
        "name": "NotEnoughAccountKeys",
        "msg": "Not Enough Account keys"
      },
      {
        "code": 6009,
        "name": "NonZeroMinimumOutAmountNotSupported",
        "msg": "Non zero minimum out amount not supported"
      },
      {
        "code": 6010,
        "name": "InvalidRoutePlan",
        "msg": "Invalid route plan"
      },
      {
        "code": 6011,
        "name": "InvalidReferralAuthority",
        "msg": "Invalid referral authority"
      },
      {
        "code": 6012,
        "name": "LedgerTokenAccountDoesNotMatch",
        "msg": "Token account doesn't match the ledger"
      },
      {
        "code": 6013,
        "name": "InvalidTokenLedger",
        "msg": "Invalid token ledger"
      },
      {
        "code": 6014,
        "name": "IncorrectTokenProgramID",
        "msg": "Token program ID is invalid"
      },
      {
        "code": 6015,
        "name": "TokenProgramNotProvided",
        "msg": "Token program not provided"
      },
      {
        "code": 6016,
        "name": "SwapNotSupported",
        "msg": "Swap not supported"
      },
      {
        "code": 6017,
        "name": "ExactOutAmountNotMatched",
        "msg": "Exact out amount doesn't match"
      },
      {
        "code": 6018,
        "name": "SourceAndDestinationMintCannotBeTheSame",
        "msg": "Source mint and destination mint cannot the same"
      }
    ]
};

export const jupiterRawTx = [
    {
      "blockTime": 1709802584,
      "indexWithinBlock": 83,
      "meta": {
        "err": null,
        "fee": 15000,
        "innerInstructions": [
          {
            "index": 0,
            "instructions": [
              {
                "accounts": [
                  2,
                  7,
                  27,
                  1
                ],
                "data": "hPG2T4qL57eAy",
                "programIdIndex": 8
              }
            ]
          },
          {
            "index": 3,
            "instructions": [
              {
                "accounts": [
                  32
                ],
                "data": "84eT",
                "programIdIndex": 8
              },
              {
                "accounts": [
                  0,
                  28
                ],
                "data": "11119os1e9qSs2u7TsThXqkBSRVFxhmYaFKFZ1waB2X7armDmvK3p5GmLdUxYdg3h7QSrL",
                "programIdIndex": 45
              },
              {
                "accounts": [
                  28
                ],
                "data": "P",
                "programIdIndex": 8
              },
              {
                "accounts": [
                  28,
                  32
                ],
                "data": "6T9CtvAjfroF4ohaf6a3vVyUF8ZgmCwZF7cReG9A1Frj4",
                "programIdIndex": 8
              }
            ]
          },
          {
            "index": 6,
            "instructions": [
              {
                "accounts": [
                  8,
                  22,
                  34,
                  23,
                  24,
                  25,
                  43,
                  26,
                  22,
                  22,
                  22,
                  22,
                  22,
                  22,
                  27,
                  29,
                  0
                ],
                "data": "67wN6s2KjMN7etLDKoTUr15",
                "programIdIndex": 33
              },
              {
                "accounts": [
                  27,
                  25,
                  0
                ],
                "data": "3WJ4ahXk7KW7",
                "programIdIndex": 8
              },
              {
                "accounts": [
                  24,
                  29,
                  34
                ],
                "data": "3UXX8N9Xe78j",
                "programIdIndex": 8
              },
              {
                "accounts": [
                  47
                ],
                "data": "QMqFu4fYGGeUEysFnenhAvR83g86EDDNxzUskfkWKYCBPWe1hqgD6jgKAXr6aYoEQd8qCi1jDP62hT6UmnfUd4evKbeGkja7Z4xNfFgDnMWAwFhSw5QivNZPG9yjVspayBryeFvpovYcR5DU6L8xhyTwgPVGmxqkZ49w2AvUARnTREF",
                "programIdIndex": 11
              },
              {
                "accounts": [
                  8,
                  0,
                  12,
                  28,
                  13,
                  29,
                  14,
                  3,
                  15,
                  16,
                  36
                ],
                "data": "59p8WydnSZtTrAFNrUZ9RYuEG1otzQBzsRnRfscbM5xjackCPpmhPb7tXy",
                "programIdIndex": 35
              },
              {
                "accounts": [
                  29,
                  14,
                  0
                ],
                "data": "3UXX8N9Xe78j",
                "programIdIndex": 8
              },
              {
                "accounts": [
                  13,
                  28,
                  12
                ],
                "data": "3PLdyPw8TdKV",
                "programIdIndex": 8
              },
              {
                "accounts": [
                  47
                ],
                "data": "QMqFu4fYGGeUEysFnenhAvDWgqp1W7DbrMv3z8JcyrP4Bu3Yyyj7irLW76wEzMiFqiJxx6qtZk5T8RDDguC4As2f5ViyRrutudnU2uwQDw8hEUvyMLmncDr1ZfQX4GjieojZ3EiX5rLewkYYX7pDeXKK7RgEULs9954gTiwMkCCXRaf",
                "programIdIndex": 11
              },
              {
                "accounts": [
                  39,
                  17,
                  0,
                  28,
                  30,
                  18,
                  19,
                  20,
                  21,
                  8,
                  40,
                  37,
                  41
                ],
                "data": "PgQWtn8oziwx5jY9BLo1mz9JQdpJ1wnJ3",
                "programIdIndex": 38
              },
              {
                "accounts": [
                  28,
                  18,
                  0
                ],
                "data": "3PLdyPw8TdKV",
                "programIdIndex": 8
              },
              {
                "accounts": [
                  20,
                  21,
                  39
                ],
                "data": "6VKPp22nU8oq",
                "programIdIndex": 8
              },
              {
                "accounts": [
                  19,
                  30,
                  39
                ],
                "data": "3Ev3GfaeUHtB",
                "programIdIndex": 8
              },
              {
                "accounts": [
                  47
                ],
                "data": "QMqFu4fYGGeUEysFnenhAvGHnSPFLovkZXi46MfLjsSzqJhm6XkVGqWpaXx8STNjEgoafNsZcrmDQKhSHUushBvvEwmFp69UewGqbW1sofQNSsTELHMABm9iJLg3vwTDz2inp3S5AytoZkCPrtN6SKCwC9PvUkCq9uW4msMZ9uWJg7q",
                "programIdIndex": 11
              }
            ]
          },
          {
            "index": 8,
            "instructions": [
              {
                "accounts": [
                  30,
                  42,
                  5,
                  0
                ],
                "data": "hnuv8AzAGgxXP",
                "programIdIndex": 8
              }
            ]
          }
        ],
        "loadedAddresses": {
          "readonly": [
            "So11111111111111111111111111111111111111112",
            "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
            "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
            "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
            "7pXf9TNWqKubbz5GBpM6Kgz3wdLCHa2nhbf9j1jYcBy5",
            "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG",
            "2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c",
            "7GmDCbu7bYiWJvFaNUyPNiM8PjvvBcmyBcZY1qSsAGi2",
            "856QrABEMYwVXStv5G1KkUtKuF3nUDPpVwFY2nc2NwXd",
            "7oo7u7iXrNCekxWWpfLYCbXyjrYLAco5FM9qSjQeNn7g",
            "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
            "Sysvar1nstructions1111111111111111111111111",
            "11111111111111111111111111111111",
            "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
            "D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf",
            "H3vkQqNVWySTD4c1Y91wtoT5iwxKSVtVLfC2rD8SgwTN"
          ],
          "writable": [
            "HQcY5n2zP6rW74fyFEhWeBd3LnJpBcZechkvJpmdb8cx",
            "2gG2nqzdqDnFRio8ttYyCkesTbfqDcbQLrv19n4weuK6",
            "EWWSKcyMy2cF1RBmcQMPyN8SafyxoUFzmzWsAqReNmQc",
            "F1RpqnTAuRYDxkJ3KGssSEanAgH1fbxgxKz1QJHouBLA",
            "9763Sjr7TkhjeTcCjW9NMknNrvVrE8QdrtqfwXQaP54i",
            "DrRd8gYMJu9XGxLhwTCPdHNLXCKHsxJtMpbn62YqmwQe",
            "EVGW4q1iFjDmtxtHr3NoPi5iVKAxwEjohsusMrinDxr6",
            "53EkU98Vbv2TQPwGG6t2asCynzFjCX5AnvaabbXafaed",
            "FGYgFJSxZTGzaLwzUL9YZqK2yUZ8seofCwGq8BPEw4o8",
            "FwWV8a193zZsYxaRAbYkrM6tmrHMoVY1Xahh2PNFejvF",
            "BhuMVCzwFVZMSuc1kBbdcAnXwFg9p4HJp7A9ddwYjsaF",
            "67xxC7oyzGFMVX8AaAHqcT3UWpPt4fMsHuoHrHvauhog",
            "FaoMKkKzMDQaURce1VLewT6K38F6FQS5UQXD1mTXJ2Cb",
            "GE8m3rHHejrNf4jE96n5gzMmLbxTfPPcmv9Ppaw24FZa",
            "HxkQdUnrPdHwXP5T9kewEXs3ApgvbufuTfdw9v1nApFd",
            "72DdMdgLxdSHNRds6vQAZRKq16vSmA8t1QmgkPNnsAPs",
            "AyQctXwnP933PUYmZzX9cfJLyEDzczrzsrvNqm4cwxXF",
            "H3e3CDMZPTHY3YQsdJPnkByZnNpBYpsmvCTHPxTqhZ3q",
            "9KXNt6J3ZoDwRbuy1johwQxmEznFPxo9ye73hNgCc91q",
            "2p8Nrz7rthX7yGY3pj6nv43Q1gHiamHnZGEQgNkUmjuh"
          ]
        },
        "logMessages": [
          "Program jupoNjAxXgZ4rjzxzPMP4oxduvQsQtZzyknqvzYNrNu invoke [1]",
          "Program log: Instruction: PreFlashFillOrder",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
          "Program log: Instruction: TransferChecked",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6200 of 456386 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program jupoNjAxXgZ4rjzxzPMP4oxduvQsQtZzyknqvzYNrNu consumed 38594 of 487091 compute units",
          "Program jupoNjAxXgZ4rjzxzPMP4oxduvQsQtZzyknqvzYNrNu success",
          "Program ComputeBudget111111111111111111111111111111 invoke [1]",
          "Program ComputeBudget111111111111111111111111111111 success",
          "Program ComputeBudget111111111111111111111111111111 invoke [1]",
          "Program ComputeBudget111111111111111111111111111111 success",
          "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]",
          "Program log: CreateIdempotent",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
          "Program log: Instruction: GetAccountDataSize",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1569 of 435292 compute units",
          "Program return: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA pQAAAAAAAAA=",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program 11111111111111111111111111111111 invoke [2]",
          "Program 11111111111111111111111111111111 success",
          "Program log: Initialize the associated token account",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
          "Program log: Instruction: InitializeImmutableOwner",
          "Program log: Please upgrade to SPL Token 2022 for immutable owner support",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1405 of 428705 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
          "Program log: Instruction: InitializeAccount3",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3158 of 424823 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 26815 of 448197 compute units",
          "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success",
          "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]",
          "Program log: CreateIdempotent",
          "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 4338 of 421382 compute units",
          "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success",
          "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]",
          "Program log: CreateIdempotent",
          "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 5838 of 417044 compute units",
          "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success",
          "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [1]",
          "Program log: Instruction: Route",
          "Program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 invoke [2]",
          "Program log: ray_log: A2SoNgAAAAAAAAAAAAAAAAABAAAAAAAAAB7IPhAIAAAAjEpmligAAACk8vyzBgAAAFoWSgEAAAAA",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
          "Program log: Instruction: Transfer",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 360072 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
          "Program log: Instruction: Transfer",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 352446 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 consumed 30668 of 377826 compute units",
          "Program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 success",
          "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]",
          "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 2021 of 344180 compute units",
          "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success",
          "Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc invoke [2]",
          "Program log: Instruction: Swap",
          "Program log: fee_growth: 26545888",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
          "Program log: Instruction: Transfer",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 295429 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
          "Program log: Instruction: Transfer",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4736 of 287864 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc consumed 47125 of 326712 compute units",
          "Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc success",
          "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]",
          "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 2021 of 276751 compute units",
          "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success",
          "Program 2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c invoke [2]",
          "Program log: Instruction: Swap",
          "Program log: AMM: {\"p\":DrRd8gYMJu9XGxLhwTCPdHNLXCKHsxJtMpbn62YqmwQe}",
          "Program log: Oracle: {\"a\":14136445556,\"b\":6764980000,\"c\":2132263253341,\"d\":14136445556}",
          "Program log: Amount: {\"in\":25367099,\"out\":3585288,\"impact\":0}",
          "Program log: TotalFee: {\"fee\":5073,\"percent\":0.02}",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
          "Program log: Instruction: Transfer",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4736 of 207367 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
          "Program log: Instruction: MintTo",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4492 of 199621 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
          "Program log: Instruction: Transfer",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 192135 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program 2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c consumed 74248 of 257002 compute units",
          "Program 2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c success",
          "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]",
          "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 2021 of 179908 compute units",
          "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success",
          "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 236462 of 411206 compute units",
          "Program return: JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 CLU2AAAAAAA=",
          "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
          "Program log: Instruction: CloseAccount",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2915 of 174744 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program jupoNjAxXgZ4rjzxzPMP4oxduvQsQtZzyknqvzYNrNu invoke [1]",
          "Program log: Instruction: FlashFillOrder",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
          "Program log: Instruction: TransferChecked",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6200 of 144716 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program data: vdt/007mYe6qwLPR1REDffbijltLkzI0xiksc7E58xwUpBG/grRSx1lHKkCyZDWBtb1Nj5NatQSurNWWy0a2b1mw9O9xbT672bhYBQAAAABZtlkFAAAAAGSoNgAAAAAAhLI2AAAAAAA=",
          "Program jupoNjAxXgZ4rjzxzPMP4oxduvQsQtZzyknqvzYNrNu consumed 36169 of 171829 compute units",
          "Program jupoNjAxXgZ4rjzxzPMP4oxduvQsQtZzyknqvzYNrNu success"
        ],
        "postBalances": [
          616745129067,
          3083280,
          2039280,
          70407360,
          304957985,
          2039280,
          1141440,
          42272871443,
          934087680,
          1,
          731913600,
          1141440,
          5435781,
          7135899479386,
          2039280,
          70407360,
          70407360,
          7231440,
          2052430507530,
          2039280,
          1461600,
          2039280,
          6124800,
          23357760,
          2039280,
          2039280,
          3591360,
          2039280,
          0,
          2039280,
          24039280,
          2039280,
          459528411866,
          1141440,
          2240705782,
          1141440,
          0,
          23942400,
          1141440,
          0,
          23942400,
          23942400,
          233373617815,
          1141440,
          0,
          1,
          5566314148,
          0,
          36236822
        ],
        "postTokenBalances": [
          {
            "accountIndex": 2,
            "mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
            "owner": "CVYjfci2W2iCivHXvnr1sRMNUoPWwHVwiLprn3s6Mfk2",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "89700569",
              "decimals": 6,
              "uiAmount": 89.70057,
              "uiAmountString": "89.700569"
            }
          },
          {
            "accountIndex": 5,
            "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "owner": "ctKPiwiyfAmEzM4SKDB5iyqsvUWxFJvoskKwwEymdNQ",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "129895068",
              "decimals": 6,
              "uiAmount": 129.89507,
              "uiAmountString": "129.895068"
            }
          },
          {
            "accountIndex": 13,
            "mint": "So11111111111111111111111111111111111111112",
            "owner": "HQcY5n2zP6rW74fyFEhWeBd3LnJpBcZechkvJpmdb8cx",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "7135897440106",
              "decimals": 9,
              "uiAmount": 7135.8975,
              "uiAmountString": "7135.897440106"
            }
          },
          {
            "accountIndex": 14,
            "mint": "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
            "owner": "HQcY5n2zP6rW74fyFEhWeBd3LnJpBcZechkvJpmdb8cx",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "5305637240078",
              "decimals": 9,
              "uiAmount": 5305.637,
              "uiAmountString": "5305.637240078"
            }
          },
          {
            "accountIndex": 18,
            "mint": "So11111111111111111111111111111111111111112",
            "owner": "7GmDCbu7bYiWJvFaNUyPNiM8PjvvBcmyBcZY1qSsAGi2",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "2052428468250",
              "decimals": 9,
              "uiAmount": 2052.4285,
              "uiAmountString": "2052.42846825"
            }
          },
          {
            "accountIndex": 19,
            "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "owner": "7GmDCbu7bYiWJvFaNUyPNiM8PjvvBcmyBcZY1qSsAGi2",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "628380851587",
              "decimals": 6,
              "uiAmount": 628380.9,
              "uiAmountString": "628380.851587"
            }
          },
          {
            "accountIndex": 21,
            "mint": "FGYgFJSxZTGzaLwzUL9YZqK2yUZ8seofCwGq8BPEw4o8",
            "owner": "CbYf9QNrkVgNRCMTDiVdvzMqSzXh8AAgnrKAoTfEACdh",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "3395695525776",
              "decimals": 9,
              "uiAmount": 3395.6956,
              "uiAmountString": "3395.695525776"
            }
          },
          {
            "accountIndex": 24,
            "mint": "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
            "owner": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "174328253348",
              "decimals": 9,
              "uiAmount": 174.32825,
              "uiAmountString": "174.328253348"
            }
          },
          {
            "accountIndex": 25,
            "mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
            "owner": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "28797386396",
              "decimals": 6,
              "uiAmount": 28797.387,
              "uiAmountString": "28797.386396"
            }
          },
          {
            "accountIndex": 27,
            "mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
            "owner": "71WDyyCsZwyEYDV91Qrb212rdg6woCHYQhFnmZUBxiJ6",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "34628706234",
              "decimals": 6,
              "uiAmount": 34628.707,
              "uiAmountString": "34628.706234"
            }
          },
          {
            "accountIndex": 29,
            "mint": "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
            "owner": "71WDyyCsZwyEYDV91Qrb212rdg6woCHYQhFnmZUBxiJ6",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "1096991469",
              "decimals": 9,
              "uiAmount": 1.0969914,
              "uiAmountString": "1.096991469"
            }
          },
          {
            "accountIndex": 30,
            "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "owner": "71WDyyCsZwyEYDV91Qrb212rdg6woCHYQhFnmZUBxiJ6",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "23778225918",
              "decimals": 6,
              "uiAmount": 23778.227,
              "uiAmountString": "23778.225918"
            }
          },
          {
            "accountIndex": 31,
            "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "owner": "H3vkQqNVWySTD4c1Y91wtoT5iwxKSVtVLfC2rD8SgwTN",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "89025105000",
              "decimals": 6,
              "uiAmount": 89025.1,
              "uiAmountString": "89025.105"
            }
          }
        ],
        "preBalances": [
          616745144067,
          3083280,
          2039280,
          70407360,
          304957985,
          2039280,
          1141440,
          42272871443,
          934087680,
          1,
          731913600,
          1141440,
          5435781,
          7135924846485,
          2039280,
          70407360,
          70407360,
          7231440,
          2052405140431,
          2039280,
          1461600,
          2039280,
          6124800,
          23357760,
          2039280,
          2039280,
          3591360,
          2039280,
          0,
          2039280,
          24039280,
          2039280,
          459528411866,
          1141440,
          2240705782,
          1141440,
          0,
          23942400,
          1141440,
          0,
          23942400,
          23942400,
          233373617815,
          1141440,
          0,
          1,
          5566314148,
          0,
          36236822
        ],
        "preTokenBalances": [
          {
            "accountIndex": 2,
            "mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
            "owner": "CVYjfci2W2iCivHXvnr1sRMNUoPWwHVwiLprn3s6Mfk2",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "93282621",
              "decimals": 6,
              "uiAmount": 93.28262,
              "uiAmountString": "93.282621"
            }
          },
          {
            "accountIndex": 5,
            "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "owner": "ctKPiwiyfAmEzM4SKDB5iyqsvUWxFJvoskKwwEymdNQ",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "126310424",
              "decimals": 6,
              "uiAmount": 126.310425,
              "uiAmountString": "126.310424"
            }
          },
          {
            "accountIndex": 13,
            "mint": "So11111111111111111111111111111111111111112",
            "owner": "HQcY5n2zP6rW74fyFEhWeBd3LnJpBcZechkvJpmdb8cx",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "7135922807205",
              "decimals": 9,
              "uiAmount": 7135.923,
              "uiAmountString": "7135.922807205"
            }
          },
          {
            "accountIndex": 14,
            "mint": "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
            "owner": "HQcY5n2zP6rW74fyFEhWeBd3LnJpBcZechkvJpmdb8cx",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "5305615607476",
              "decimals": 9,
              "uiAmount": 5305.6157,
              "uiAmountString": "5305.615607476"
            }
          },
          {
            "accountIndex": 18,
            "mint": "So11111111111111111111111111111111111111112",
            "owner": "7GmDCbu7bYiWJvFaNUyPNiM8PjvvBcmyBcZY1qSsAGi2",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "2052403101151",
              "decimals": 9,
              "uiAmount": 2052.403,
              "uiAmountString": "2052.403101151"
            }
          },
          {
            "accountIndex": 19,
            "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "owner": "7GmDCbu7bYiWJvFaNUyPNiM8PjvvBcmyBcZY1qSsAGi2",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "628384436875",
              "decimals": 6,
              "uiAmount": 628384.44,
              "uiAmountString": "628384.436875"
            }
          },
          {
            "accountIndex": 21,
            "mint": "FGYgFJSxZTGzaLwzUL9YZqK2yUZ8seofCwGq8BPEw4o8",
            "owner": "CbYf9QNrkVgNRCMTDiVdvzMqSzXh8AAgnrKAoTfEACdh",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "3395695519521",
              "decimals": 9,
              "uiAmount": 3395.6956,
              "uiAmountString": "3395.695519521"
            }
          },
          {
            "accountIndex": 24,
            "mint": "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
            "owner": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "174349885950",
              "decimals": 9,
              "uiAmount": 174.34988,
              "uiAmountString": "174.34988595"
            }
          },
          {
            "accountIndex": 25,
            "mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
            "owner": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "28793804344",
              "decimals": 6,
              "uiAmount": 28793.805,
              "uiAmountString": "28793.804344"
            }
          },
          {
            "accountIndex": 27,
            "mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
            "owner": "71WDyyCsZwyEYDV91Qrb212rdg6woCHYQhFnmZUBxiJ6",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "34628706234",
              "decimals": 6,
              "uiAmount": 34628.707,
              "uiAmountString": "34628.706234"
            }
          },
          {
            "accountIndex": 29,
            "mint": "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
            "owner": "71WDyyCsZwyEYDV91Qrb212rdg6woCHYQhFnmZUBxiJ6",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "1096991469",
              "decimals": 9,
              "uiAmount": 1.0969914,
              "uiAmountString": "1.096991469"
            }
          },
          {
            "accountIndex": 30,
            "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "owner": "71WDyyCsZwyEYDV91Qrb212rdg6woCHYQhFnmZUBxiJ6",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "23778225274",
              "decimals": 6,
              "uiAmount": 23778.225,
              "uiAmountString": "23778.225274"
            }
          },
          {
            "accountIndex": 31,
            "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "owner": "H3vkQqNVWySTD4c1Y91wtoT5iwxKSVtVLfC2rD8SgwTN",
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "uiTokenAmount": {
              "amount": "89025105000",
              "decimals": 6,
              "uiAmount": 89025.1,
              "uiAmountString": "89025.105"
            }
          }
        ],
        "rewards": []
      },
      "slot": 252636198,
      "transaction": {
        "message": {
          "accountKeys": [
            "71WDyyCsZwyEYDV91Qrb212rdg6woCHYQhFnmZUBxiJ6",
            "CVYjfci2W2iCivHXvnr1sRMNUoPWwHVwiLprn3s6Mfk2",
            "Abr2BQLweEtTaZo6KhANPMskR6E62ixVP43T3wNuX4Kf",
            "GWvyD94pBVHqV7swFG6ASwD8BHeyeumonQ1yv6qEt3ce",
            "ctKPiwiyfAmEzM4SKDB5iyqsvUWxFJvoskKwwEymdNQ",
            "DCidmvKr91LouZbELNuAXJJ8xeUHVrDE2pwqBYAJ1yDX",
            "jupoNjAxXgZ4rjzxzPMP4oxduvQsQtZzyknqvzYNrNu",
            "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "ComputeBudget111111111111111111111111111111",
            "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
            "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"
          ],
          "addressTableLookups": [
            {
              "accountKey": "822jCwCEU2SKw34fappH7NzYNckjaBrTc3SuFj1A9gB4",
              "readonlyIndexes": [
                231,
                24,
                27,
                16,
                245,
                47
              ],
              "writableIndexes": [
                200,
                246,
                242,
                243,
                247
              ]
            },
            {
              "accountKey": "G3yuYaJGF4EnGneYHmwvtMHKavXhqz5x5WVaCzzCJYpQ",
              "readonlyIndexes": [
                214,
                212,
                211,
                216
              ],
              "writableIndexes": [
                206,
                215,
                207,
                213,
                210
              ]
            },
            {
              "accountKey": "8C1prTGFgNwayEWY1U7JfUotySB4JpDLbp6BK1eQGjMH",
              "readonlyIndexes": [
                133,
                11
              ],
              "writableIndexes": [
                117,
                144,
                142,
                118,
                119
              ]
            },
            {
              "accountKey": "8fSv82wiDE5VX2ZztaQ3WKJE7nGwMcezBC9TL6jp4JgQ",
              "readonlyIndexes": [
                26,
                0,
                28,
                21,
                8
              ],
              "writableIndexes": [
                24,
                25,
                29,
                23,
                10
              ]
            }
          ],
          "header": {
            "numReadonlySignedAccounts": 0,
            "numReadonlyUnsignedAccounts": 6,
            "numRequiredSignatures": 1
          },
          "instructions": [
            {
              "accounts": [
                1,
                2,
                0,
                27,
                7,
                8,
                44,
                45
              ],
              "data": "WfEVVf5U1c95MbMrsu7QTq",
              "programIdIndex": 6
            },
            {
              "accounts": [],
              "data": "Jg5QEb",
              "programIdIndex": 9
            },
            {
              "accounts": [],
              "data": "3Msf4pwCZi7q",
              "programIdIndex": 9
            },
            {
              "accounts": [
                0,
                28,
                0,
                32,
                45,
                8
              ],
              "data": "2",
              "programIdIndex": 10
            },
            {
              "accounts": [
                0,
                29,
                0,
                46,
                45,
                8
              ],
              "data": "2",
              "programIdIndex": 10
            },
            {
              "accounts": [
                0,
                30,
                0,
                42,
                45,
                8
              ],
              "data": "2",
              "programIdIndex": 10
            },
            {
              "accounts": [
                8,
                0,
                27,
                30,
                11,
                42,
                11,
                47,
                11,
                33,
                8,
                22,
                34,
                23,
                24,
                25,
                43,
                26,
                22,
                22,
                22,
                22,
                22,
                22,
                27,
                29,
                0,
                35,
                8,
                0,
                12,
                28,
                13,
                29,
                14,
                3,
                15,
                16,
                36,
                38,
                39,
                17,
                0,
                28,
                30,
                18,
                19,
                20,
                21,
                8,
                40,
                37,
                41
              ],
              "data": "2HVEByRpLjtVhaCFkDCSi3dndahWJkgEGGW4gZTDPpjeMHt1j5588hctvHEHV",
              "programIdIndex": 11
            },
            {
              "accounts": [
                28,
                0,
                0
              ],
              "data": "A",
              "programIdIndex": 8
            },
            {
              "accounts": [
                1,
                2,
                4,
                0,
                5,
                30,
                48,
                31,
                6,
                7,
                8,
                42,
                8,
                45
              ],
              "data": "YAkwcZmcY2tir3kHHxpVpb",
              "programIdIndex": 6
            }
          ],
          "recentBlockhash": "D8XyJfdtQCERBsvB2Bupt1kUmqUtiBhPxdAkTp9CvDmv"
        },
        "signatures": [
          "5cm2kyqtj73fWEjvSGWvA5XzqPfYjdX4XLJhRLykQ5BfWQeJaMXfAdJDUZ1Fjr3rKhZMJTVzir7Zg6hSNnQbfNub"
        ]
      },
      "version": 0
    }
];