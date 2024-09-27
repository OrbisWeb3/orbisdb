import logger from "../../logger/index.js";
import { 
  oamoCredentialModelDefinition,
  oamoCredentialRelationModelDefinition,
  oamoPublicProfileModelDefinition
} from "./oamoModelDefinitions.js";

export default class OamoPlugin {
  constructor() {
    this.modelIds = {
      "credential": "kjzl6hvfrbw6c58woky2dzatio53rkckfguk9rti3x6va1x8fwyvscca7ymecvw",
      "profile": "kjzl6hvfrbw6c7ulp7aqwwe4wbysxmzjjeuqt4dvi9onqhvhc7ebmuqq9dk57cr",
      "relation": "kjzl6hvfrbw6c6nsxgdm1vhz0k54yltfl4mkxabhm33k0bh4fg3ijej0vgk9dlf"
    };
  }

  async init() {
    await this.createModels();
    await this.start();
    return {
      HOOKS: {
        generate: () => this.start(),
        validate: (stream) => this.isValid(stream),
        add_metadata: (stream) => this.addMetadata(stream),
      },
      ROUTES: {},
    };
  }

  async createModels() {
    try {
      /*const credentialModel = await global.indexingService.ceramic.orbisdb.ceramic.createModel(oamoCredentialModelDefinition);
      this.modelIds.credential = credentialModel.id;
      logger.info("Model 'OamoCredential' created successfully with ID:", this.modelIds.credential);

      const profileModel = await global.indexingService.ceramic.orbisdb.ceramic.createModel(oamoPublicProfileModelDefinition);
      this.modelIds.profile = profileModel.id;
      logger.info("Model 'OamoPublicProfile' created successfully with ID:", this.modelIds.profile);

      const relationModel = await global.indexingService.ceramic.orbisdb.ceramic.createModel(oamoCredentialRelationModelDefinition);
      this.modelIds.relation = relationModel.id;
      logger.info("Model 'OamoCredentialRelation' created successfully with ID:", this.modelIds.relation); */

    } catch (error) {
      logger.error("Error creating Oamo models:", error);
      throw error;
    }
  }

  async start() {
    logger.info("Starting ComprehensiveOamoPlugin");
    this.createStreams();
    this.interval = setInterval(() => this.createStreams(), 5000);
  }

  async stop() {
    logger.info("Stopping ComprehensiveOamoPlugin");
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async createStreams() {
    logger.info("ComprehensiveOamoPlugin: Creating new streams for all models.");

    try {
      // Create credential stream
      const credentialContent = this.generateCredentialContent();
      const credentialStream = await global.indexingService.ceramic.orbisdb
        .insert(this.modelIds.credential)
        .value(credentialContent)
        .run();
      logger.info("OamoCredential stream created with ID:", credentialStream.id);

      // Create profile stream
      const profileContent = this.generateProfileContent();
      const profileStream = await global.indexingService.ceramic.orbisdb
        .insert(this.modelIds.profile)
        .value(profileContent)
        .run();
      logger.info("OamoPublicProfile stream created with ID:", profileStream.id);

      // Create relation stream using actual stream IDs
      const relationContent = this.generateRelationContent(credentialStream.id, profileStream.id);
      const relationStream = await global.indexingService.ceramic.orbisdb
        .insert(this.modelIds.relation)
        .value(relationContent)
        .run();
      logger.info("OamoCredentialRelation stream created with ID:", relationStream.id); 

    } catch (e) {
      logger.error("Error creating streams:", e);
      logger.error(this.modelIds);
    }
  }


  isValid() {
    return true;
  }

  async addMetadata(stream) {
    return {};
  }

  generateCredentialContent() {
    return {
      name: `Credential ${this.generateUniqueId()}`,
      pfp: Math.random() > 0.5 ? `https://example.com/pfp/${this.generateUniqueId()}.jpg` : null,
      description: Math.random() > 0.5 ? `Description for credential ${this.generateUniqueId()}` : null,
      context: Math.random() > 0.5 ? `Context for credential ${this.generateUniqueId()}` : null,
    };
  }

  generateRelationContent(credentialId, profileId) {
    return {
      publicProfileId: profileId,
      credentialId: credentialId,
      version: Math.floor(Math.random() * 9999) + 1,
      createdOn: new Date().toISOString(),
    };
  }

  generateProfileContent() {
    return {
      status: ["INACTIVE", "ACTIVE", "DELETED"][Math.floor(Math.random() * 3)],
      version: Math.floor(Math.random() * 9999) + 1,
      account_score: Math.floor(Math.random() * 100),
      wallet_holding_score: Math.floor(Math.random() * 100),
      onchain_usd_amount_score: Math.floor(Math.random() * 1000),
      walletAddress: this.generateRandomWalletAddress(),
      createdOn: new Date().toISOString(),
    };
  }

  generateUniqueCredential() {
    return `credential-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateUniqueId() {
    return `streamid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateRandomWalletAddress() {
    return '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }
}