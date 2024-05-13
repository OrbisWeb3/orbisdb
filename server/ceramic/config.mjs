import { ModelAccountRelation } from "@ceramicnetwork/stream-model";
import { cliColors } from "../utils/cliColors.mjs"
import { OrbisDB } from "@useorbis/db-sdk";
import { OrbisKeyDidAuth } from "@useorbis/db-sdk/auth";

/** Import Orbis SDK */
import { CeramicClient } from '@ceramicnetwork/http-client';
import { Model } from '@ceramicnetwork/stream-model';
import { ModelInstanceDocument } from "@ceramicnetwork/stream-model-instance";
import { StreamID } from "@ceramicnetwork/streamid";

/** To generate dids from a Seed */
import { DID } from 'dids'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import { getResolver } from 'key-did-resolver'

export default class Ceramic {
    constructor(node, instance, seed) {
        try {
            let nodeUrl = cleanNodeUrl(node);
            this.node = nodeUrl;

            // Initialize OrbisDB
            this.orbisdb = new OrbisDB({
                ceramic: {
                    gateway: nodeUrl,
                },
                nodes: [
                {
                    gateway: instance,
                    key: "<YOUR_API_KEY>",
                },
                ],
            });

            this.client = this.orbisdb.ceramic.client;
            console.log(cliColors.text.cyan, "📍 Initialized Ceramic client via dbsdk with node:", cliColors.reset, this.node);

            // Connect to Ceramic using seed
            this.connect(seed);
        } catch(e) {
            console.log(cliColors.text.red, "Error connecting to Ceramic client:", cliColors.reset, e) ; 
        }
    }

    /** Will connect to the Ceramic seed defined globally */
    async connect(seed) {
        let _seed = new Uint8Array(seed);
        const auth = await OrbisKeyDidAuth.fromSeed(_seed);

        try {
            const result = await this.orbisdb.connectUser({ auth });
            this.session = result.session;
            console.log(cliColors.text.cyan, "📍 Connected to Ceramic via dbsdk with did:", cliColors.reset, result.user.did);           
    
        } catch(e) {
            console.log(cliColors.text.red, "Error connecting to OrbisDB:", cliColors.reset, e);
        }

        /** Create social models 
        try {
            let model = await this.orbisdb.ceramic.createModel(privateMessageModelDefinition);
            console.log("model:", model); 
        } catch(e) {
            console.log(cliColors.text.red, "Error creating model:", cliColors.reset, e);
        }*/
    }
}

// TODO: Make sure Ceramic node's URL is valid
function cleanNodeUrl(url) {
    return url;
}

/** Model for OrbisDB contexts */
/** 
 * StreamID Mainnet: kjzl6hvfrbw6c52v85swdm53yzahr8k9zojf0w7krz18f3gzk9ppyz11bx0plar 
 * StreamID Testnet: ___ 
 * */
const orbisdbContextModelDefinition = {
    "name": "OrbisDBContext",
    "version": "2.0",
    "accountRelation": {
        "type": "list"
    },
    "interface": false, 
    "implements": [], 
    "schema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
            "name": {
                "type": "string"
            },
            "pfp": {
                "type": ["string", "null"]
            },
            "description": {
                "type": ["string", "null"]
            },
            "context": {
                "type":  ["string", "null"]
            },
            "description": {
                "type": ["string", "null"]
            }
        },
        "additionalProperties": false
    }
};


/** 
 * StreamID Mainnet: ___ 
 * StreamID Testnet: kjzl6hvfrbw6c58ymz86815ejdbu5xpkwr169zih87k83bykaj14lte3e42u58w 
 * */
const discoursePostsModelDefinition = {
    "name": "DiscoursePosts",
    "version": "2.0",
    "accountRelation": {
        "type": "list"
    },
    "interface": false, 
    "implements": [], 
    "schema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
            "dao_name": {
                "type": "string"
            },
            "author": {
                "type": ["string", "null"]
            },
            "Role": {
                "type": ["string", "null"]
            },
            "content": {
                "type":  ["string", "null"]
            },
            "post_time": {
                "type": ["string", "null"]
            },
            "total_likes": {
                "type": ["integer", "null"]
            },
            "likes": {
                "type": ["string", "null"]
            },
            "TotalEmojiReactions": {
                "type": ["integer", "null"]
            },
            "emoji_reactions": {
                "type": ["string", "null"]
            },
            "replies": {
                "type": ["string", "null"]
            },
            "repliers": {
                "type": ["string", "null"]
            },
            "TotalReplies": {
                "type": ["integer", "null"]
            },
            "post_links": {
                "type": ["string", "null"]
            },
            "link_clicks": {
                "type": ["string", "null"]
            },
            "Links": {
                "type": ["string", "null"]
            },
            "Images": {
                "type": ["string", "null"]
            },
            "title": {
                "type": ["string", "null"]
            },
            "post_identifier": {
                "type": ["string", "null"]
            },
            "PostID": {
                "type": ["string", "null"]
            }
        },
        "additionalProperties": false
    }
};


/** Model for Orbis posts */
/** 
 * StreamID Mainnet: kjzl6hvfrbw6c88wvnnb8x62rwvt5iphtvgmg88s4qis09nvchbij21c70th28a 
 * */
const fullPostModelDefinition = {
    "name": "SocialPost",
    "version": "2.0",
    "accountRelation": {
        "type": "list"
    },
    "interface": false,
    "implements": [],
    "schema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
            "title": {
                "type": ["string", "null"]
            },
            "body": {
                "type": ["string", "null"]
            },
            "context": {
                "type": ["string", "null"]
            },
            "sourceUrl": {
                "type": ["string", "null"]
            },
            "media": {
                "type":  ["array", "null"],
                "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                        "title": {
                            "type": ["string", "null"]
                        },
                        "url": {
                            "type": "string",
                                "maxLength": 150
                        },
                        "gateway": {
                            "type": ["string", "null"]
                        }
                    },
                    "required": ["url"]
                }
            },
            "tags": {
                "type":  ["array", "null"],
                "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                        "slug": {
                            "type": "string"
                        },
                        "title": {
                            "type": ["string", "null"]
                        }
                    }
                }
            },
            "encryptedBody": {
                "type": ["object", "null"],
                "additionalProperties": false,
                "additionalProperties": false,
                "properties": {
                    "encryptedString": {
                        "type": "string",
                    },
                    "encryptedSymmetricKey": {
                        "type": "string",
                    },
                    "accessControlConditions": {
                        "type": "string",
                    }
                }
            },
            "master": {
            "type": ["string", "null"]
            },
            "reply_to": {
            "type": ["string", "null"]
            },
            "mentions": {
                "type": ["array", "null"],
                "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                        "did": {
                            "type": "string"
                        },
                        "username": {
                            "type": "string"
                        }
                    },
                    "required": ["did", "username"]
                }
            },
            "data": {
            "type": ["string", "null"]
            }
        },
        "required": ["body"],
        "additionalProperties": false
    }
};

/** Model for Orbis profiles */
/** 
 * StreamID Mainnet: kjzl6hvfrbw6c9ajvxfoyxcpi8zbiilf5c62zyxk1tzt31rsei9zeq1sqddy09a 
 * */
const profileModelDefinition = {
    "name": "SocialProfile",
    "version": "2.0",
    "accountRelation": {
        "type": "single"
    },
    "interface": false, 
    "implements": [], 
    "schema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
            "username": {
                "type": ["string", "null"]
            },
            "description": {
                "type": ["string", "null"]
            },
            "cover": {
                "type": ["string", "null"]
            },
            "pfp": {
                "type": ["string", "null"]
            },
            "pfpIsNft": {
                "additionalProperties": false,
                "type": ["object", "null"],
                "properties": {
                        "chain": {
                            "type": "string",
                        },
                        "tokenId": {
                            "type": "string",
                        },
                        "contract": {
                            "type": "string",
                        },
                        "timestamp": {
                            "type": "string",
                        },
                },
                "additionalProperties": false
            },
            "data": {
                "type": ["string", "null"]
            }
        },
        "additionalProperties": false
    }
};

/** Model for Orbis reactions */
/** StreamID Mainnet: kjzl6hvfrbw6catjwpn53stszvbv04ez7phlfheparps47kbx8q7t11z6l06lwl */
const reactionsModelDefinition = {
    "name": "SocialReaction",
    "version": "2.0",
    "accountRelation": {
        "type": "set",
        "fields": [
            "post_id"
        ]
    },
    "interface": false, 
    "implements": [], 
    "schema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
        "type": {
            "type": "string"
        },
        "post_id": {
            "type": "string"
        }
        },
        "required": ["type", "post_id"],
        "additionalProperties": false
    }
};

/** Model for Orbis follow */
/** StreamID Mainnet: kjzl6hvfrbw6c7m2zwttqjjrh9uibh3im0qmxab3apf7wq37lrjid26iyu137jt */
const followModelDefinition = {
    "name": "SocialFollow",
    "version": "2.0",
    "accountRelation": {
        "type": "set",
        "fields": [
            "did"
        ]
    },
    "interface": false, 
    "implements": [], 
    "schema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
            "did": {
                "type": "string"
            },
            "active": {
                "type": "boolean"
            },
            },
        "required": ["did", "active"],
        "additionalProperties": false
    }
};

/** 
 * Model for the user's encrypted email posts 
 * StreamID: kjzl6hvfrbw6c7i887rh9a3kieykdfai4k5lc95wv9nbgzphijmrcqm1885at63
 * */
const encryptedEmailModelDefinition = {
    "name": "SocialEncryptedEmail",
    "version": "2.0",
    "accountRelation": {
        "type": "single"
    },
    "interface": false, 
    "implements": [], 
    "schema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
            "encryptedEmail": {
                "type": "object",
                "additionalProperties": false,
                "properties": {
                    "encryptedString": {
                        "type": "string",
                    },
                    "encryptedSymmetricKey": {
                        "type": "string",
                    },
                    "accessControlConditions": {
                        "type": "string",
                    }
                }
            }
        },
        "additionalProperties": false
    }
};

/** Model for conversations
 * StreamID: kjzl6hvfrbw6c8ynorxt2tp766711479zupiaq6ai80wgsgbr256hbap4mpspt3
 */

const conversationModelDefinition = {
    "name": "SocialConversation",
    "version": "2.0",
    "accountRelation": {
        "type": "list"
    },
    "interface": false, 
    "implements": [], 
    "schema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
            "name": {
                "type": ["string", "null"]
            },
            "description": {
                "type": ["string", "null"]
            },
            "context": {
                "type": ["string", "null"]
            },
            "recipients": {
                "type": "array",
                "items": {
                    "type": "string",
                }
            }
        },
        "required": ["recipients"],
        "additionalProperties": false
    }
};

/** Model for private messages
 * StreamID: kjzl6hvfrbw6cav5vj5fmqxxt95gjlkuxroafdl4elues1il176flbixrcaq9bv
 */
const privateMessageModelDefinition = {
    "name": "SocialPrivateMessage",
    "version": "2.0",
    "accountRelation": {
        "type": "list"
    },
    "interface": false, 
    "implements": [], 
    "schema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
            "conversation_id": {
                "type": "string"
            },
            "master": {
                "type": ["string", "null"]
            },
            "reply_to": {
                "type": ["string", "null"]
            },
            "encryptedMessage": {
                "type": ["object", "null"],
                "properties": {
                    "encryptedString": {
                        "type": "string",
                    },
                    "encryptedSymmetricKey": {
                        "type": "string",
                    },
                    "accessControlConditions": {
                        "type": "string",
                    }
                },
                "additionalProperties": false
            },
            "encryptedMessageSolana": {
                "type": ["object", "null"],
                "properties": {
                    "encryptedString": {
                        "type": "string",
                    },
                    "encryptedSymmetricKey": {
                        "type": "string",
                    },
                    "solRpcConditions": {
                        "type": "string",
                    }
                },
                "additionalProperties": false
            }
        },
        "required": ["conversation_id"],
        "additionalProperties": false
    }
};

/** Model for proposal */
/** 
 * StreamID Mainnet: kjzl6hvfrbw6c9k9g95am3g8s7gp8fp48qqjvxtrarwfo7njbcd0la801wcfwoz
 * */
const proposalModelDefinition = {
    "name": "SolPartyProposal",
    "version": "1.0",
    "accountRelation": {
      "type": "list"
    },
    "schema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
        "name": {
            "type": "string"
        },
        "description": {
            "type":  ["string", "null"]
        },
        "protocol": {
            "type": "string"
        },
        "timestamp_end": {
            "type": ["integer", "null"]
        },
        "options": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": false,
                "properties": {
                    "name": {
                        "type": "string"
                    },
                    "id": {
                        "type": "string"
                    },
                },
                "required": ["name"]
            }
        },
        },
        "required": ["name"],
        "additionalProperties": false
    }
};

/** Model for votes */
/** 
 * StreamID Mainnet: kjzl6hvfrbw6ca82toboen7mrjumkcmldfv0dn9rlyr73jpvvge867aqzuikfcj 
 * */
const voteModelDefinition = {
    "name": "SolPartyVote",
    "version": "2.0",
    "accountRelation": {
        "type": "set",
        "fields": [
            "proposal_id"
        ]
    },
    "interface": false, 
    "implements": [], 
    "schema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
            "proposal_id": {
                "type": "string"
            },
            "option": {
                "type": "string"
            }
        },
        "required": ["proposal_id", "option"],
        "additionalProperties": false
    }
};


/**** NOT IMPLEMENTED YET ****/

/** Schema for the Orbis conversations */


/** Schema for the Orbis messages */


/** Schema for the Orbis settings notifications */
export const socialSettingsNotificationsRead = {
	"$schema": "http://json-schema.org/draft-07/schema#",
	"title": "SocialSettingsNotificationsRead",
	"type": "object",
  "properties": {
    "last_notifications_read_time": {
      "type": "integer"
    }
	},
  "required": ["last_notifications_read_time"]
};
