import { gql, GraphQLClient } from "graphql-request";
import logger from "../../logger/index.js";
import { OrbisDB } from "@useorbis/db-sdk";

export default class VeraxListenerPlugin {
  constructor() {
    this.endpoint = "https://api.studio.thegraph.com/query/67521/verax-v2/v2.5";
    this.pageSize = 10;
    this.isListening = false;
    this.attestationModelId =
      "kjzl6hvfrbw6cat6thy6b07gjebowgtgye79t23lzt0o1xzfkte4l8qv4hpof86";
    this.indexItemModelId =
      "kjzl6hvfrbw6c6hkpw7pee0jbu21086ojm3n13n0944tf3tlrch3332v6jxvdav";
    this.orderBy = "id";
    this.order = "asc";

    this.client = new GraphQLClient(this.endpoint);
    this.userOrbis = new OrbisDB({
      ceramic: { gateway: "http://composedb.orbisdb:7007/" },
      nodes: [{ gateway: "http://localhost:7008", key: "<YOUR_API_KEY>" }],
    });
  }

  async init() {
    return {
      HOOKS: {
        generate: () => this.start(),
      },
    };
  }

  async fetchData() {
    if (!this.isListening) return;

    const query = gql`
      query (
        $first: Int
        $orderBy: String
        $orderDirection: String
        $where: Attestation_filter
      ) {
        attestations(
          first: $first
          orderBy: $orderBy
          orderDirection: $orderDirection
          where: $where
        ) {
          id
          attestedDate
          attester
          expirationDate
          replacedBy
          revocationDate
          version
          revoked
          attestationData
          subject
          portal {
            id
            name
            description
            ownerAddress
            ownerName
            modules
            isRevocable
            attestationCounter
          }
          schema {
            id
            name
            description
            context
            schema
            attestationCounter
          }
        }
      }
    `;

    const variables = {
      first: this.pageSize,
      orderBy: this.orderBy,
      orderDirection: this.order,
      where: {
        schema: this.schemaId,
      },
    };

    try {
      const data = await this.client.request(query, variables);
      const myAttestations = data.attestations;

      if (myAttestations.length === 0) {
        logger.info("No data found in this fetch. Will try again...");
      } else {
        this.onData(myAttestations); // Call the callback with the fetched data
      }

      // Schedule the next fetch after the interval
      setTimeout(() => this.fetchData(), 10 * 1000);
    } catch (error) {
      logger.error("Error fetching data:", error);
      this.stop();
    }
  }

  async start() {
    await this.userOrbis.connectUser({
      serializedSession: this.indexOwnerSession,
    });
    if (this.isListening) {
      logger.info("Already listening...");
      return;
    }

    this.isListening = true;
    logger.info("Started listening...");
    this.fetchData();
  }

  async stop() {
    if (!this.isListening) {
      logger.info("Not currently listening...");
      return;
    }

    this.isListening = false;
    logger.info("Stopped listening.");
  }

  async onData(data) {
    const transformed = data.map(
      async ({ id, decodedData, attestationData, ...rest }) => {
        const res = {
          ...rest,
          attestationID: id,
          subjectWallet: rest.subject,
          expirationDate: new Date(rest.expirationDate * 1000).toISOString(),
          attestedDate: new Date(rest.attestedDate * 1000).toISOString(),
          revocationDate: new Date(rest.revocationDate * 1000).toISOString(),
        };
        let stream = await this.userOrbis
          .insert(this.attestationModelId)
          .value(res)
          .context(this.context)
          .run();

        let indexItem = await this.userOrbis
          .insert(this.indexItemModelId)
          .value({
            indexId: this.indexId,
            itemId: stream.id.toString(),
            modelId: this.attestationModelId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .run();

        // console.log(`Stream ${stream.id.toString()} is indexed under ${indexItem.id.toString()}`);

      }
    );
    await Promise.all(transformed);
  }
}
