import logger from "../../logger/index.js";
import { 
  oamoCredentialModelDefinition,
  oamoCredentialRelationModelDefinition,
  oamoPublicProfileModelDefinition
} from "./oamoModelDefinitions.js";

export default class OamoPlugin {
  constructor() {
    this.modelIds = {
      "credential": "kjzl6hvfrbw6c9cjpo0punf40mcppjji9ef229h5u0w55m2v2xox15ognrs6oev",
     // "profile": "kjzl6hvfrbw6c61x15yq8phxqb1jdjtng2zmfipj54smmhlu0d2die78wp1n62w",
     // "relation": "kjzl6hvfrbw6c76tpxlxw283jc3oyxu9bd7294ibyvfyetcagod6gesva8vlx0c"
    };
  }

  async init() {
    await this.start();
    return {
      HOOKS: {
        generate: () => this.start(),
        validate: (stream) => this.isValid(stream),
        add_metadata: (stream) => this.addMetadata(stream),
      },
    };
  }

  async start() {
    logger.info("Starting OamoPlugin");
    await this.indexExistingStreams();
  }

  async stop() {
    logger.info("Stopping OamoPlugin");
  }

  async indexExistingStreams() {
    for (const [modelType, modelId] of Object.entries(this.modelIds)) {
      logger.info(`Indexing existing streams for model: ${modelType}`);
      try {
        const streams = await this.getStreamsByModel(modelId);
        for (const stream of streams) {
          await this.indexStream(stream, modelType);
        }
      } catch (error) {
        logger.error(`Error indexing streams for model ${modelType}:`, error);
      }
    }
  }

  async getStreamsByModel(modelId) {
    try {
      logger.info(`Querying streams for model: ${modelId}`);
      
      const graphqlQuery = {
        query: `query {
          oamoCredentialIndex {
            edges {
              node {
                id
                status
                chainID
                version
                category
                chainName
                createdOn
                updatedOn
                rootCredential
                verifiableCredential
              }
            }
          }
        }`,
        first: 5,
        models: [modelId]
      };
  
      const result = await global.indexingService.ceramic.orbisdb
        .select()
        .raw(JSON.stringify(graphqlQuery))
        .run();
      
      logger.info(`Retrieved ${result.rows.length} streams for model: ${modelId}`);
      return result;
    } catch (error) {
      logger.error(`Error querying streams for model ${modelId}:`, error);
      if (error.details && error.details.error) {
        logger.error('Detailed error:', error.details.error);
      }
      if (error.details && error.details.query) {
        logger.error('Query details:', JSON.stringify(error.details.query, null, 2));
      }
      throw error;
    }
  }

  async indexStream(stream, modelType) {
    try {
      const content = await stream.content();
      const metadata = await stream.state.metadata;

      const processedData = {
        stream_id: stream.id.toString(),
        model: this.modelIds[modelType],
        controller: metadata.controllers[0],
        content: content,
      };

      const { isValid } = await this.isValid(processedData);
      if (!isValid) {
        logger.debug(`Stream ${stream.id.toString()} is not valid, skipping indexing.`);
        return;
      }

      const { pluginsData } = await this.addMetadata(processedData);

      const insertedContent = {
        stream_id: processedData.stream_id,
        controller: processedData.controller,
        ...processedData.content,
        _metadata_context: modelType,
      };

      await global.indexingService.database.upsert(this.modelIds[modelType], insertedContent, pluginsData);
      logger.info(`Indexed stream ${stream.id.toString()} of type ${modelType}`);
    } catch (error) {
      logger.error(`Error indexing stream ${stream.id.toString()}:`, error);
    }
  }

  async isValid(stream) {
    // Implement your validation logic here
    return { isValid: true };
  }

  async addMetadata(stream) {
    // Implement your metadata addition logic here
    return { pluginsData: {} };
  }
}