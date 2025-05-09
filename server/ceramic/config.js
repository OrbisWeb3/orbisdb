import { ModelAccountRelation } from "@ceramicnetwork/stream-model";
import { cliColors } from "../utils/cliColors.js";
import { OrbisDB } from "@useorbis/db-sdk";
import { OrbisKeyDidAuth } from "@useorbis/db-sdk/auth";
import logger from "../logger/index.js";
import { parseDidSeed, sleep } from "../utils/helpers.js";

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
      logger.debug(
        cliColors.text.cyan,
        "📍 Initialized Ceramic client via dbsdk with node:",
        cliColors.reset,
        this.node
      );

      // Connect to Ceramic using seed
      this.connect(seed);
    } catch (e) {
      logger.error(
        cliColors.text.red,
        "Error connecting to Ceramic client:",
        cliColors.reset,
        e
      );
    }
  }

  /** Will connect to the Ceramic seed defined globally */
  async connect(seed) {
    const auth = await OrbisKeyDidAuth.fromSeed(parseDidSeed(seed));

    try {
      const result = await this.orbisdb.connectUser({ auth });
      this.session = result.session;
      logger.debug(
        cliColors.text.cyan,
        "📍 Connected to Ceramic via dbsdk with did:",
        cliColors.reset,
        result.user.did
      );
    } catch (e) {
      logger.error(
        cliColors.text.red,
        "Error connecting to OrbisDB:",
        cliColors.reset,
        e
      );
    }
  }
}

// TODO: Make sure Ceramic node's URL is valid
function cleanNodeUrl(url) {
  return url;
}

/** Model for OrbisDB contexts */
/**
 * StreamID Mainnet: kjzl6hvfrbw6c6lqihb9i25vyr4hob667w8otxyzw7fohetbaqkjqrgjvll1h4b
 * StreamID Recon: kjzl6hvfrbw6c6lqihb9i25vyr4hob667w8otxyzw7fohetbaqkjqrgjvll1h4b
 * */
const orbisdbContextModelDefinition = {
  name: "OrbisDBContext",
  version: "2.0",
  accountRelation: {
    type: "list",
  },
  interface: false, // Assuming this field is part of your ModelDefinitionV2
  implements: [], // Example field for ModelDefinitionV2
  schema: {
    type: "object",
    $schema: "https://json-schema.org/draft/2020-12/schema",
    properties: {
      name: {
        type: "string",
      },
      pfp: {
        type: ["string", "null"],
      },
      description: {
        type: ["string", "null"],
      },
      context: {
        type: ["string", "null"],
      },
      description: {
        type: ["string", "null"],
      },
    },
    additionalProperties: false,
  },
};

/**
 * StreamID Mainnet: ___
 * StreamID Testnet: kjzl6hvfrbw6c58ymz86815ejdbu5xpkwr169zih87k83bykaj14lte3e42u58w
 * */
const discoursePostsModelDefinition = {
  name: "DiscoursePosts",
  version: "2.0",
  accountRelation: {
    type: "list",
  },
  interface: false, // Assuming this field is part of your ModelDefinitionV2
  implements: [], // Example field for ModelDefinitionV2
  schema: {
    type: "object",
    $schema: "https://json-schema.org/draft/2020-12/schema",
    properties: {
      dao_name: {
        type: "string",
      },
      author: {
        type: ["string", "null"],
      },
      Role: {
        type: ["string", "null"],
      },
      content: {
        type: ["string", "null"],
      },
      post_time: {
        type: ["string", "null"],
      },
      total_likes: {
        type: ["integer", "null"],
      },
      likes: {
        type: ["string", "null"],
      },
      TotalEmojiReactions: {
        type: ["integer", "null"],
      },
      emoji_reactions: {
        type: ["string", "null"],
      },
      replies: {
        type: ["string", "null"],
      },
      repliers: {
        type: ["string", "null"],
      },
      TotalReplies: {
        type: ["integer", "null"],
      },
      post_links: {
        type: ["string", "null"],
      },
      link_clicks: {
        type: ["string", "null"],
      },
      Links: {
        type: ["string", "null"],
      },
      Images: {
        type: ["string", "null"],
      },
      title: {
        type: ["string", "null"],
      },
      post_identifier: {
        type: ["string", "null"],
      },
      PostID: {
        type: ["string", "null"],
      },
    },
    additionalProperties: false,
  },
};

/** Model for Orbis posts */
/**
 * StreamID Mainnet: kjzl6hvfrbw6c88wvnnb8x62rwvt5iphtvgmg88s4qis09nvchbij21c70th28a
 * StreamID Recon: kjzl6hvfrbw6cajk0869qi0tthihoy9q8kycwymavzho6b66p9d9qi3yplnv4is
 * */
const fullPostModelDefinition = {
  name: "SocialPost",
  version: "2.0",
  accountRelation: {
    type: "list",
  },
  interface: false,
  implements: [],
  schema: {
    type: "object",
    $schema: "https://json-schema.org/draft/2020-12/schema",
    properties: {
      title: {
        type: ["string", "null"],
      },
      body: {
        type: ["string", "null"],
      },
      context: {
        type: ["string", "null"],
      },
      sourceUrl: {
        type: ["string", "null"],
      },
      media: {
        type: ["array", "null"],
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: {
              type: ["string", "null"],
            },
            url: {
              type: "string",
              maxLength: 150,
            },
            gateway: {
              type: ["string", "null"],
            },
          },
          required: ["url"],
        },
      },
      tags: {
        type: ["array", "null"],
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            slug: {
              type: "string",
            },
            title: {
              type: ["string", "null"],
            },
          },
        },
      },
      encryptedBody: {
        type: ["object", "null"],
        additionalProperties: false,
        additionalProperties: false,
        properties: {
          encryptedString: {
            type: "string",
          },
          encryptedSymmetricKey: {
            type: "string",
          },
          accessControlConditions: {
            type: "string",
          },
        },
      },
      master: {
        type: ["string", "null"],
      },
      reply_to: {
        type: ["string", "null"],
      },
      mentions: {
        type: ["array", "null"],
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            did: {
              type: "string",
            },
            username: {
              type: "string",
            },
          },
          required: ["did", "username"],
        },
      },
      data: {
        type: ["string", "null"],
      },
    },
    required: ["body"],
    additionalProperties: false,
  },
};

/** Model for Orbis profiles */
/**
 * StreamID Mainnet: kjzl6hvfrbw6c9ajvxfoyxcpi8zbiilf5c62zyxk1tzt31rsei9zeq1sqddy09a
 * StreamID Recon: kjzl6hvfrbw6c9x1dusvyt413a3emwmeouk9qswky6mu4a7g0764392i5xdo573
 * */
const profileModelDefinition = {
  name: "SocialProfile",
  version: "2.0",
  accountRelation: {
    type: "single",
  },
  interface: false, // Assuming this field is part of your ModelDefinitionV2
  implements: [], // Example field for ModelDefinitionV2
  schema: {
    type: "object",
    $schema: "https://json-schema.org/draft/2020-12/schema",
    properties: {
      username: {
        type: ["string", "null"],
      },
      description: {
        type: ["string", "null"],
      },
      cover: {
        type: ["string", "null"],
      },
      pfp: {
        type: ["string", "null"],
      },
      pfpIsNft: {
        additionalProperties: false,
        type: ["object", "null"],
        properties: {
          chain: {
            type: "string",
          },
          tokenId: {
            type: "string",
          },
          contract: {
            type: "string",
          },
          timestamp: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
      data: {
        type: ["string", "null"],
      },
    },
    additionalProperties: false,
  },
};

/** Model for Orbis reactions */
/**
 * StreamID Mainnet: kjzl6hvfrbw6caca84g61qjl4v4zyhlnzfknowvaitq1c35gl54yb6jg71gxohc
 * StreamID Recon: kjzl6hvfrbw6caca84g61qjl4v4zyhlnzfknowvaitq1c35gl54yb6jg71gxohc
 * */
const reactionsModelDefinition = {
  name: "SocialReaction",
  version: "2.0",
  accountRelation: {
    type: "set",
    fields: ["post_id"],
  },
  interface: false, // Assuming this field is part of your ModelDefinitionV2
  implements: [], // Example field for ModelDefinitionV2
  schema: {
    type: "object",
    $schema: "https://json-schema.org/draft/2020-12/schema",
    properties: {
      type: {
        type: "string",
      },
      post_id: {
        type: "string",
      },
    },
    required: ["type", "post_id"],
    additionalProperties: false,
  },
};

/** Model for Orbis follow */
/**
 * StreamID Mainnet: kjzl6hvfrbw6c7m2zwttqjjrh9uibh3im0qmxab3apf7wq37lrjid26iyu137jt
 * StreamID Recon: kjzl6hvfrbw6c93uuh5e5h0twvqdtm0aynhywdmvixefiy54dzalx74eocfkqfk
 * */
const followModelDefinition = {
  name: "SocialFollow",
  version: "2.0",
  accountRelation: {
    type: "set",
    fields: ["did"],
  },
  interface: false, // Assuming this field is part of your ModelDefinitionV2
  implements: [], // Example field for ModelDefinitionV2
  schema: {
    type: "object",
    $schema: "https://json-schema.org/draft/2020-12/schema",
    properties: {
      did: {
        type: "string",
      },
      active: {
        type: "boolean",
      },
    },
    required: ["did", "active"],
    additionalProperties: false,
  },
};

/** Model for proposal */
/**
 * StreamID Mainnet: kjzl6hvfrbw6c6czaljcbq6gbzmhsehcb9edaxov0wa0qoxby3fgq1m213u0pfp
 * StreamID Recon: kjzl6hvfrbw6c89iy11sksbox1vb6sjfojh669fqdi73shvflqaw6d1svr6ozo6
 * */
const proposalModelDefinition = {
  name: "GovernanceProposals",
  version: "1.0",
  accountRelation: {
    type: "list",
  },
  schema: {
    type: "object",
    $schema: "https://json-schema.org/draft/2020-12/schema",
    properties: {
      name: {
        type: "string",
      },
      description: {
        type: ["string", "null"],
      },
      protocol: {
        type: "string",
      },
      timestamp_end: {
        type: ["integer", "null"],
      },
      options: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: {
              type: "string",
            },
            id: {
              type: "string",
            },
          },
          required: ["name"],
        },
      },
    },
    required: ["name"],
    additionalProperties: false,
  },
};

/** Model for votes */
/**
 * StreamID Mainnet: kjzl6hvfrbw6carr31lps2ujx1wngyyl5mm09fmaj22v5bhg1vgxbms08k1mnn5
 * StreamID Recon: kjzl6hvfrbw6c5cil3sb0bxzf0q9sg62vswx5q59uktx7ozax2dmqbjnhvwlfju
 * */
const voteModelDefinition = {
  name: "GovernanceVotes",
  version: "2.0",
  accountRelation: {
    type: "set",
    fields: ["proposal_id"],
  },
  interface: false, // Assuming this field is part of your ModelDefinitionV2
  implements: [], // Example field for ModelDefinitionV2
  schema: {
    type: "object",
    $schema: "https://json-schema.org/draft/2020-12/schema",
    properties: {
      proposal_id: {
        type: "string",
      },
      option: {
        type: "string",
      },
    },
    required: ["proposal_id", "option"],
    additionalProperties: false,
  },
};

/** Schema for the user's encrypted email posts */
/**
 * StreamID Recon: kjzl6hvfrbw6caidfppsrbalmig520hrzvgtmcj7kviobmt92n77gpsqqj5jk9p
 */
export const socialEncryptedEmailSchema = {
  name: "SocialEncryptedEmail",
  schema: {
    type: "object",
    $schema: "https://json-schema.org/draft/2020-12/schema",
    properties: {
      encryptedEmail: {
        type: "object",
        properties: {
          encryptedString: {
            type: "string",
          },
          encryptedSymmetricKey: {
            type: "string",
          },
          accessControlConditions: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  },
  version: "2.0",
  interface: false,
  implements: [],
  accountRelation: {
    type: "single",
  },
};

/**** NOT IMPLEMENTED YET ****/
/**
 * Schema for the Orbis conversations
 * StreamID Mainnet: kjzl6hvfrbw6c8ynorxt2tp766711479zupiaq6ai80wgsgbr256hbap4mpspt3
 * StreamID Recon: kjzl6hvfrbw6cabk4x5rqdanaaxf164iu8n3vrzz2zfspk1g44d2zbmkbsvuz6k
 * */
export const socialConversationSchema = {
  name: "SocialConversation",
  schema: {
    type: "object",
    $schema: "https://json-schema.org/draft/2020-12/schema",
    required: ["recipients"],
    properties: {
      name: {
        type: ["string", "null"],
      },
      context: {
        type: ["string", "null"],
      },
      recipients: {
        type: "array",
        items: {
          type: "string",
        },
      },
      description: {
        type: ["string", "null"],
      },
    },
    additionalProperties: false,
  },
  version: "2.0",
  interface: false,
  implements: [],
  accountRelation: {
    type: "list",
  },
};

/**
 *  Schema for the Orbis messages
 * StreamID Mainnet: kjzl6hvfrbw6cav5vj5fmqxxt95gjlkuxroafdl4elues1il176flbixrcaq9bv
 * StreamID Recon: kjzl6hvfrbw6ca08skivz4p240lk31ga73hg4t95p85p6vlpf4i0njdcccmwgdo
 * */
export const socialPrivateMessageSchema = {
  name: "SocialPrivateMessage",
  schema: {
    type: "object",
    $schema: "https://json-schema.org/draft/2020-12/schema",
    required: ["conversation_id"],
    properties: {
      master: {
        type: ["string", "null"],
      },
      reply_to: {
        type: ["string", "null"],
      },
      conversation_id: {
        type: "string",
      },
      encryptedMessage: {
        type: ["object", "null"],
        properties: {
          encryptedString: {
            type: "string",
          },
          encryptedSymmetricKey: {
            type: "string",
          },
          accessControlConditions: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
      encryptedMessageSolana: {
        type: ["object", "null"],
        properties: {
          encryptedString: {
            type: "string",
          },
          solRpcConditions: {
            type: "string",
          },
          encryptedSymmetricKey: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  },
  version: "2.0",
  interface: false,
  implements: [],
  accountRelation: {
    type: "list",
  },
};

/** Schema for the Orbis settings notifications */
export const socialSettingsNotificationsRead = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "SocialSettingsNotificationsRead",
  type: "object",
  properties: {
    last_notifications_read_time: {
      type: "integer",
    },
  },
  required: ["last_notifications_read_time"],
};
