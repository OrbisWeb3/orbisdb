import logger from "../../logger/index.js";
import { 
  oamoCredentialModelDefinition,
  oamoCredentialRelationModelDefinition,
  oamoPublicProfileModelDefinition
} from "./oamoModelDefinitions.js";

export default class OamoPlugin {
  constructor() {

    /* local version 

      "credential": "kjzl6hvfrbw6c58woky2dzatio53rkckfguk9rti3x6va1x8fwyvscca7ymecvw",
      "profile": "kjzl6hvfrbw6c7ulp7aqwwe4wbysxmzjjeuqt4dvi9onqhvhc7ebmuqq9dk57cr",
      "relation": "kjzl6hvfrbw6c6nsxgdm1vhz0k54yltfl4mkxabhm33k0bh4fg3ijej0vgk9dlf"

    */

    this.modelIds = {
      "credential": "kjzl6hvfrbw6c9cjpo0punf40mcppjji9ef229h5u0w55m2v2xox15ognrs6oev",
      "profile": "kjzl6hvfrbw6c61x15yq8phxqb1jdjtng2zmfipj54smmhlu0d2die78wp1n62w",
      "relation": "kjzl6hvfrbw6c76tpxlxw283jc3oyxu9bd7294ibyvfyetcagod6gesva8vlx0c"
    };
  }

  async init() {

    //if we want to test with mock data

    //await this.createModels();

    //create the tables for our 3 models

    //await global.indexingService.databases["global"].indexModel(this.modelIds.credential, null, true)
   //await global.indexingService.databases["global"].indexModel(this.modelIds.profile, null, true)
   // await global.indexingService.databases["global"].indexModel(this.modelIds.relation, null, true)
    await this.start();
    return {
      HOOKS: {
        generate: () => this.start(),
        validate: (stream) => this.isValid(stream),
        filter: (stream) => this.filter(stream),
        add_metadata: (stream) => this.addMetadata(stream),
      },
      ROUTES: {},
    };
  }

  async createModels() {
    try {
      const credentialModel = await global.indexingService.ceramic.orbisdb.ceramic.createModel(oamoCredentialModelDefinition);
      this.modelIds.credential = credentialModel.id;
      logger.info("Model 'OamoCredential' created successfully with ID:", this.modelIds.credential);

      const profileModel = await global.indexingService.ceramic.orbisdb.ceramic.createModel(oamoPublicProfileModelDefinition);
      this.modelIds.profile = profileModel.id;
      logger.info("Model 'OamoPublicProfile' created successfully with ID:", this.modelIds.profile);

      const relationModel = await global.indexingService.ceramic.orbisdb.ceramic.createModel(oamoCredentialRelationModelDefinition);
      this.modelIds.relation = relationModel.id;
      logger.info("Model 'OamoCredentialRelation' created successfully with ID:", this.modelIds.relation); 

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

  async filter(stream) {
    //logic to filter?
  }

  isValid() {
    return true;
  }

  async addMetadata(stream) {
    return {};
  }

  generateCredentialContent() {
    const statuses = ["INACTIVE", "ACTIVE", "DELETED"];
    const categories = ["Identity", "Education", "Employment", "Finance", "Health"];
    const chainNames = ["Ethereum", "Polygon", "Binance Smart Chain", "Avalanche", "Solana"];

    return {
      status: statuses[Math.floor(Math.random() * statuses.length)],
      version: Math.floor(Math.random() * 9999) + 1,
      chainID: Math.floor(Math.random() * 100) + 1, // Assuming chain IDs are between 1 and 100
      chainName: chainNames[Math.floor(Math.random() * chainNames.length)],
      rootCredential: `root-${this.generateUniqueId()}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      verifiableCredential: `vc-${this.generateUniqueId()}`,
      createdOn: new Date().toISOString(),
    };
  }

  generateRelationContent(credentialId, profileId) {
    return {
      publicProfileId: profileId,
      credentialId: credentialId,
      version: Math.floor(Math.random() * 9999) + 1,
      createdOn: new Date().toISOString()
    };
  }

  generateProfileContent() {
    const statuses = ["INACTIVE", "ACTIVE", "DELETED"];
    return {
      status: statuses[Math.floor(Math.random() * statuses.length)],
      version: Math.floor(Math.random() * 9999) + 1,
      account_score: Math.floor(Math.random() * 101), // 0 to 100
      wallet_holding_score: Math.floor(Math.random() * 101), // 0 to 100
      onchain_usd_amount_score: Math.floor(Math.random() * 1001), // 0 to 1000
      walletAddress: this.generateRandomWalletAddress(),
      createdOn: new Date().toISOString()
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