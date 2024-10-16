export const oamoCredentialModelDefinition = {
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

  export const oamoCredentialRelationModelDefinition = {
    name: "OamoCredentialRelation",
    version: "2.0",
    accountRelation: {
      type: "list",
    },
    interface: false,
    implements: [],
    schema: {
      type: "object",
      $schema: "https://json-schema.org/draft/2020-12/schema",
      required: ["publicProfileId", "credentialId", "version", "createdOn"],
      properties: {
        version: {
          type: "integer",
          maximum: 9999,
          minimum: 1,
        },
        createdOn: {
          type: "string",
          format: "date-time",
          maxLength: 100,
        },
        updatedOn: {
          type: "string",
          format: "date-time",
          maxLength: 100,
        },
        credentialId: {
          type: "string",
          maxLength: 100,
        },
        publicProfileId: {
          type: "string",
          maxLength: 100,
        },
      },
      additionalProperties: false,
    },
    relations: {
      credentialId: {
        type: "document",
        model: "kjzl6hvfrbw6c58woky2dzatio53rkckfguk9rti3x6va1x8fwyvscca7ymecvw",
      },
      publicProfileId: {
        type: "document",
        model: "kjzl6hvfrbw6c7ulp7aqwwe4wbysxmzjjeuqt4dvi9onqhvhc7ebmuqq9dk57cr",
      },
    },
  };

  export const oamoPublicProfileModelDefinition = {
    name: "OamoPublicProfile",
    version: "2.0",
    accountRelation: {
      type: "list",
    },
    interface: false,
    implements: [],
    schema: {
      type: "object",
      $schema: "https://json-schema.org/draft/2020-12/schema",
      required: [
        "status",
        "version",
        "account_score",
        "wallet_holding_score",
        "onchain_usd_amount_score",
        "walletAddress",
        "createdOn",
      ],
      properties: {
        status: {
          type: "string",
          enum: ["INACTIVE", "ACTIVE", "DELETED"],
        },
        version: {
          type: "integer",
          maximum: 9999,
          minimum: 1,
        },
        createdOn: {
          type: "string",
          format: "date-time",
          maxLength: 100,
        },
        updatedOn: {
          type: "string",
          format: "date-time",
          maxLength: 100,
        },
        account_score: {
          type: "integer",
          minimum: 0,
        },
        walletAddress: {
          type: "string",
          maxLength: 100,
          minLength: 1,
        },
        wallet_holding_score: {
          type: "integer",
          minimum: 0,
        },
        onchain_usd_amount_score: {
          type: "integer",
          minimum: 0,
        },
      },
      additionalProperties: false,
    },
  };