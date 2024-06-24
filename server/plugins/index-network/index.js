import { gql, GraphQLClient } from "graphql-request";
import logger from "../../logger/index.js";

export default class VeraxListenerPlugin {
  constructor() {
    this.endpoint = "https://api.studio.thegraph.com/query/67521/verax-v2/v2.5";
    this.pageSize = 10;
    this.isListening = false;
    this.attestationModelId =
      "kjzl6hvfrbw6c6wwwsgtaokzn3tug3ajpd50oogrvhuloxbaqu0ii9ncrqu4baz";
    this.indexItemModelId =
      "kjzl6hvfrbw6c88x6ce5pncbkict551wiojwe0d66wc7fwaq4udw14zn5a7mae2";
    this.indexId =
      "kjzl6kcym7w8yb52uekurca6dnvmn854vfn6vrcgscn1d0ckq99zckvh2mx0kft";
    this.orderBy = "id";
    this.order = "asc";
    this.where = {
      schema:
        "0x86e936ffddb895a13271ddb23cbf23b90ce44628b82de518dc0a6d117fed12db",
    };
    this.client = new GraphQLClient(this.endpoint);
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
      where: this.where,
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
          attestedDate: new Date(rest.expirationDate * 1000).toISOString(),
          revocationDate: new Date(rest.revocationDate * 1000).toISOString(),
        };
        let stream = await global.indexingService.ceramic.orbisdb
          .insert(this.attestationModelId)
          .value(res)
          .context(this.context)
          .run();

        let indexItem = await global.indexingService.ceramic.orbisdb
          .insert(this.indexItemModelId)
          .value({
            indexId: this.indexId,
            itemId: stream.id.toString(),
            modelId: this.attestationModelId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .run();
        //.context(this.context)

        console.log(
          `Stream ${stream.id.toString()} is indexed under ${indexItem.id.toString()}`
        );

        //process.exit(0);
      }
    );
    await Promise.all(transformed);
  }
}
