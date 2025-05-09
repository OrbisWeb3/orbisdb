import { isSchemaValid, cleanDidPath } from "../../utils/helpers.js";
import { createYoga } from "graphql-yoga";

const graphqlInstances = {};
const schemaMap = {};

/** Will register a graphQL endpoint for each slot */
export async function registerGraphQLRoute(server, _slot, database) {
  const schema = await database.generateGraphQLSchema();
  const slot = cleanDidPath(_slot);
  console.log("Building schema for slot:", slot);

  // Will make sure schema is valid before registering it
  if (!isSchemaValid(schema)) {
    console.error(`Invalid schema for slot: ${slot}. Skipping.`);
    return;
  }

  schemaMap[slot] = schema; // Store the schema in a map to be re-used when refreshing schema

  const graphqlInstance = createYoga({ schema });

  graphqlInstances[slot] = graphqlInstance;
}

/** Will refresh the schema to make sure it takes into account the last changes (relations, new models, etc) */
export async function refreshGraphQLSchema(db, _slot) {
  const slot = cleanDidPath(_slot);

  try {
    console.log(`Refreshing GraphQL schema for slot: ${slot}...`);
    const newSchema = await db.generateGraphQLSchema();

    if (!isSchemaValid(newSchema)) {
      throw `Invalid schema generated for slot: ${slot}. Using old schema.`;
    }

    // Update the schema in the map
    schemaMap[slot] = newSchema;

    const graphqlInstance = createYoga({ schema: newSchema });

    graphqlInstances[slot] = graphqlInstance;
  } catch (error) {
    console.error(`Failed to refresh GraphQL schema for slot ${slot}:`, error);
  }
}

export default async function (server, opts) {
  server.route({
    url: "/:slot/graphql",
    method: ["GET", "POST", "OPTIONS"],
    handler: async (req, reply) => {
      const { slot } = req.params;
      const { query } = req.body;

      if (!query) {
        return reply.badRequest("Invalid body provided, no query found.");
      }

      const instance = graphqlInstances[cleanDidPath(slot)];
      if (!instance) {
        return reply.notFound(`No GraphQL instance found for slot: ${slot}`);
      }

      const response = await instance.handleNodeRequestAndResponse(req, reply, {
        req,
        reply,
      });

      response.headers.forEach((value, key) => {
        reply.header(key, value);
      });

      reply.status(response.status);
      reply.send(response.body);
      return reply;
    },
  });
}
