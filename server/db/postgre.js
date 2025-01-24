import postgresql from "pg";
import {
  buildSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLList,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLSchema,
  GraphQLEnumType,
} from "graphql";
import { GraphQLJSONObject } from "graphql-scalars";

import { snakeCase } from "change-case";
import { cliColors } from "../utils/cliColors.js";
const { Pool, Client } = postgresql;
import {
  getOrbisDBSettings,
  updateOrbisDBSettings,
  getTableName,
  getTableModelId,
} from "../utils/helpers.js";
import logger from "../logger/index.js";
import { refreshGraphQLSchema } from "../routes/graphql/index.js";

const pgErrorToCode = (_message) => {
  const message_to_code = {
    econnrefused: "CONN_REFUSED",
    "does not support ssl": "NO_SSL",
    "already been connected": "NO_REUSE",
    "connection terminated": "CONN_TERMINATED",
    "timeout expired": "TIMEOUT",
  };

  const message = _message.toLowerCase();

  for (const [key, code] of Object.entries(message_to_code)) {
    if (message.includes(key)) {
      return code;
    }
  }

  return "UNKNOWN";
};

const checkSSLSupport = async ({ user, database, password, host, port }) => {
  const connection = new Client({
    user,
    database,
    password,
    host,
    port,
    connectionTimeoutMillis: 2000,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await connection.connect();

    return true;
  } catch (err) {
    const code = pgErrorToCode(err.message);

    if (code === "NO_SSL") {
      return false;
    }

    throw `${code}: ${err}`;
  } finally {
    await connection.end();
  }
};

/**
 * DB implementation to index streams with Postgre
 */
export default class Postgre {
  constructor(user, database, password, host, port, slot, supportsSSL) {
    this.connection = null;
    this.supportsSSL = supportsSSL;
    this.slot = slot;

    // Instantiate new pool for postgresql database (we skip ssl for local)
    this.adminPool = new Pool({
      user,
      database,
      password,
      host,
      port,
      max: 20, // Set pool max size to 20
      idleTimeoutMillis: 30000, // Set idle timeout to 30 seconds
      connectionTimeoutMillis: 30000, // Set connection timeout to 2 seconds
      ssl: this.supportsSSL ? { rejectUnauthorized: false } : false,
    });

    logger.debug(
      cliColors.text.cyan,
      "🗄️  Initialized PostgreSQL DB with admin user:",
      cliColors.reset,
      user
    );
  }

  static async initialize(user, database, password, host, port, slot) {
    try {
      const supportsSSL = await checkSSLSupport({
        user,
        database,
        password,
        host,
        port,
      });

      const postgre = new Postgre(
        user,
        database,
        password,
        host,
        port,
        slot,
        supportsSSL
      );

      await postgre.checkReadOnlyUser(database, host, port);
      await postgre.bootstrapTables();

      logger.debug(
        cliColors.text.cyan,
        "🗄️  Initialized PostgreSQL DB with admin user:",
        cliColors.reset,
        user
      );

      return postgre;
    } catch (err) {
      logger.error(
        cliColors.text.red,
        "🗄️  Error initializing PostgreSQL DB with admin user:",
        cliColors.reset,
        user,
        ":",
        err
      );

      throw err;
    }
  }

  /** Will create a new read only user to make sure only SELECT queries can be performed from front-end */
  async checkReadOnlyUser(database, host, port) {
    let readOnlyUsername = "read_only_orbisdb_3";
    let readOnlyPassword = "read_only_orbisdb_pw";

    // Check if readonly user exists
    const readOnlyUserExists = await this.checkIfDbUserExists(readOnlyUsername);

    // If read only user doesn't exist we create it
    const client = await this.adminPool.connect();

    // Step 1: Create a new user (role)
    if (!readOnlyUserExists) {
      try {
        await client.query(
          `CREATE USER ${readOnlyUsername} WITH PASSWORD '${readOnlyPassword}';`
        );
        logger.debug(
          cliColors.text.cyan,
          "👁️  Read-only user created with:",
          cliColors.reset,
          readOnlyUsername
        );
      } catch (e) {
        logger.error(
          cliColors.text.red,
          "👁️  Error creating read-only user:",
          cliColors.reset,
          e.stack
        );
      }
    }

    // Step 2: Grant connect permission on the database
    try {
      await client.query(
        `GRANT CONNECT ON DATABASE ${database} TO ${readOnlyUsername};`
      );
      logger.debug(
        cliColors.text.cyan,
        "👁️  Granting connect permission to read-only user:",
        cliColors.reset,
        readOnlyUsername
      );
    } catch (e) {
      logger.error(
        cliColors.text.red,
        "👁️  Error granting connect to read-only user:",
        cliColors.reset,
        e.stack
      );
    }

    // Step 3: Grant usage permission on the schema
    try {
      await client.query(
        `GRANT USAGE ON SCHEMA public TO ${readOnlyUsername};`
      );
      logger.debug(
        cliColors.text.cyan,
        "👁️  Granting usage permission on schema to read-only user:",
        cliColors.reset,
        readOnlyUsername
      );
    } catch (e) {
      logger.error(
        cliColors.text.red,
        "👁️  Error granting usage permission on schema to read-only user:",
        cliColors.reset,
        e.stack
      );
    }

    // Step 4: Grant select permission on all tables in the schema
    try {
      await client.query(
        `GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${readOnlyUsername};`
      );
      logger.debug(
        cliColors.text.cyan,
        "👁️  Granting select permission on all tables to read-only user:",
        cliColors.reset,
        readOnlyUsername
      );
    } catch (e) {
      logger.error(
        cliColors.text.red,
        "👁️  Error granting select permission on all tables to read-only user:",
        cliColors.reset,
        e.stack
      );
    }

    // Step 5: Make the privileges effective immediately for new tables
    try {
      await client.query(
        `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ${readOnlyUsername};`
      );
      logger.debug(
        cliColors.text.cyan,
        "👁️  Applying privileges to read-only user:",
        cliColors.reset,
        readOnlyUsername
      );
    } catch (e) {
      logger.error(
        cliColors.text.red,
        "👁️  Error applying privileges to read-only user:",
        cliColors.reset,
        e.stack
      );
    }

    client.release();

    // Instantiate new pool for postgresql database
    this.readOnlyPool = new Pool({
      user: readOnlyUsername,
      database,
      password: readOnlyPassword,
      host,
      port,
      ssl: this.supportsSSL ? { rejectUnauthorized: false } : false,
    });

    logger.debug(
      cliColors.text.cyan,
      "🗄️  Initialized read-only db pool with: ",
      cliColors.reset,
      readOnlyUsername
    );
  }

  // Will check if a specific DB user exists with username
  async checkIfDbUserExists(username) {
    const client = await this.adminPool.connect();
    try {
      const queryText = `SELECT 1 FROM pg_roles WHERE rolname = $1`;
      const res = await client.query(queryText, [username]);
      return res.rowCount > 0;
    } catch (err) {
      logger.error("Error querying the database:", err.stack);
      return false;
    } finally {
      client.release();
    }
  }

  // Fetch DB schema to create GraphQL schema for the database
  async fetchDBSchema() {
    const client = await this.adminPool.connect();
    try {
      const result = await client.query(`
        SELECT 
          table_name, 
          column_name, 
          CASE
            WHEN data_type = 'USER-DEFINED' 
              THEN 
                  udt_name
              ELSE 
                  data_type
          END as data_type
        FROM 
            information_schema.columns
        WHERE 
            table_schema = 'public'
      `);

      const schema = result.rows.reduce((acc, row) => {
        if (!acc[row.table_name]) {
          acc[row.table_name] = { columns: {} };
        }
        acc[row.table_name].columns[row.column_name] = row.data_type;
        return acc;
      }, {});

      return schema;
    } finally {
      client.release();
    }
  }

  async fetchExtensions() {
    const client = await this.adminPool.connect();
    try {
      const result = await client.query(
        `SELECT name, default_version as version, installed_version FROM pg_available_extensions;`
      );

      return result.rows.map(({ name, version, installed_version }) => {
        return {
          name,
          version,
          installed: Boolean(installed_version),
        };
      });
    } catch (e) {
      console.log(e);
      return [];
    } finally {
      client.release();
    }
  }

  async enableExtension(extension) {
    const client = await this.adminPool.connect();
    try {
      await client.query(`CREATE EXTENSION IF NOT EXISTS ${extension}`);

      return true;
    } catch (e) {
      return false;
    } finally {
      client.release();
    }
  }

  async disableExtension(extension) {
    const client = await this.adminPool.connect();
    try {
      await client.query(`DROP EXTENSION IF EXISTS ${extension};`);

      return true;
    } catch (e) {
      return false;
    } finally {
      client.release();
    }
  }

  // Helper function to map field types to GraphQL types
  getGraphQLType(fieldType) {
    switch (fieldType) {
      case "character varying":
      case "text":
        return GraphQLString;
      case "integer":
        return GraphQLInt;
      case "boolean":
        return GraphQLBoolean;
      case "float8":
        return GraphQLFloat;
      case "json":
      case "jsonb":
        return GraphQLJSONObject;
      case "vector": // Add support for the VECTOR type
        return new GraphQLList(GraphQLFloat);
      default:
        if (fieldType.startsWith("_")) {
          const elementType = this.getGraphQLType(fieldType.substring(1));
          return new GraphQLList(elementType || GraphQLString);
        }
        return GraphQLString;
    }
  }

  // Helper function to create filter input types
  createFilterInputType(typeName, fields) {
    const filterFields = {};

    Object.entries(fields).forEach(([fieldName, { type, databaseType }]) => {
      filterFields[`${fieldName}`] = { type };
      filterFields[`${fieldName}_eq`] = { type };
      filterFields[`${fieldName}_ne`] = { type };
      filterFields[`${fieldName}_gt`] = { type };
      filterFields[`${fieldName}_lt`] = { type };
      filterFields[`${fieldName}_gte`] = { type };
      filterFields[`${fieldName}_lte`] = { type };
      filterFields[`${fieldName}_like`] = { type: GraphQLString };
      filterFields[`${fieldName}_in`] = { type: new GraphQLList(type) };
      filterFields[`${fieldName}_nin`] = { type: new GraphQLList(type) };

      // Add similarity filter for vector fields
      if (databaseType === "vector") {
        filterFields[`${fieldName}_near`] = {
          // Input vector for similarity queries
          type: new GraphQLList(GraphQLFloat),
        };
      }
    });

    return new GraphQLInputObjectType({
      name: `${typeName}Filter`,
      fields: filterFields,
    });
  }

  // Helper function to create orderBy input types
  createOrderByInputType(typeName, fields) {
    const orderByEnumValues = {};

    Object.entries(fields).forEach(([fieldName, { databaseType }]) => {
      orderByEnumValues[fieldName] = { value: fieldName };
      // Support ordering by similarity
      if (databaseType === "vector") {
        orderByEnumValues[fieldName + "_simil"] = {
          value: fieldName + "_simil",
        };
      }
    });

    const OrderByEnum = new GraphQLEnumType({
      name: `${typeName}OrderByEnum`,
      values: {
        ...orderByEnumValues,
        ASC: { value: "ASC" },
        DESC: { value: "DESC" },
      },
    });

    return new GraphQLInputObjectType({
      name: `${typeName}OrderBy`,
      fields: {
        field: { type: OrderByEnum },
        direction: { type: OrderByEnum },
      },
    });
  }

  /** Function to generate the GraphQL schema using the DB schema and relations specified by the user */
  async generateGraphQLSchema() {
    const settings = getOrbisDBSettings(this.slot);
    const dbSchema = await this.fetchDBSchema();
    const modelsMapping = settings.models_mapping || {};
    const relations = settings.relations || {};

    let typeDefs = {};
    let inputTypeDefs = {};
    let orderByTypeDefs = {};

    // Define all types initially
    for (const [modelId, { columns }] of Object.entries(dbSchema)) {
      const typeName = modelsMapping[modelId] || modelId;
      const fields = {};
      const inputFields = {};

      for (const [fieldName, fieldType] of Object.entries(columns)) {
        const graphqlType = this.getGraphQLType(fieldType);
        fields[fieldName] = { type: graphqlType, databaseType: fieldType };
        inputFields[fieldName] = { type: graphqlType };
      }

      typeDefs[typeName] = () => ({
        name: typeName,
        fields,
      });

      inputTypeDefs[`${typeName}Filter`] = this.createFilterInputType(
        typeName,
        fields
      );
      orderByTypeDefs[`${typeName}OrderBy`] = this.createOrderByInputType(
        typeName,
        fields
      );
    }

    // Define GraphQL Object Types with possible relations
    const finalTypeDefs = {};
    for (const typeName in typeDefs) {
      finalTypeDefs[typeName] = new GraphQLObjectType({
        name: typeName,
        fields: () => {
          const fields = typeDefs[typeName](); // Get fields from the thunk
          const relFields = {};

          let modelId = getTableModelId(typeName, this.slot);

          if (relations[modelId]) {
            for (const relation of relations[modelId]) {
              const relatedTypeName =
                modelsMapping[relation.referencedTable] ||
                relation.referencedTable;
              const relatedType = finalTypeDefs[relatedTypeName];

              relFields[relation.referenceName] = {
                type:
                  relation.referencedType === "list"
                    ? new GraphQLList(relatedType)
                    : relatedType,
                resolve: async (source) => {
                  const client = await this.adminPool.connect();
                  try {
                    const referencedTable = relation.referencedTable;
                    const referencedColumn = relation.referencedColumn;
                    const value = source[relation.column];
                    const params = [value];
                    let query;
                    let result;

                    switch (relation.referencedType) {
                      case "single":
                        query = `SELECT * FROM ${referencedTable} WHERE ${referencedColumn} = $1 LIMIT 1`;
                        result = await client.query(query, params);
                        return result.rows[0];
                      case "list":
                        query = `SELECT * FROM ${referencedTable} WHERE ${referencedColumn} = $1 LIMIT 50`;
                        result = await client.query(query, params);
                        return result.rows;
                      default:
                        query = `SELECT * FROM ${referencedTable} WHERE ${referencedColumn} = $1 LIMIT 1`;
                        result = await client.query(query, params);
                        return result.rows[0];
                    }
                  } finally {
                    client.release();
                  }
                },
              };
            }
          }
          return { ...fields.fields, ...relFields }; // Combine relational fields with regular fields
        },
      });
    }

    // Construct the main query type with resolve functions
    const queryFields = this.prepareQueryFields(
      modelsMapping,
      dbSchema,
      finalTypeDefs,
      inputTypeDefs,
      orderByTypeDefs
    );

    // Return the fully constructed GraphQL schema
    const queryType = new GraphQLObjectType({
      name: "Query",
      fields: queryFields,
    });

    return new GraphQLSchema({
      query: queryType,
    });
  }

  // Method to prepare query fields
  prepareQueryFields(
    modelsMapping,
    dbSchema,
    finalTypeDefs,
    inputTypeDefs,
    orderByTypeDefs
  ) {
    const queryFields = {};
    Object.entries(dbSchema).forEach(([modelId]) => {
      const typeName = modelsMapping[modelId] || modelId;
      const filterTypeName = `${typeName}Filter`;
      const orderByTypeName = `${typeName}OrderBy`;

      if (inputTypeDefs[filterTypeName]) {
        queryFields[typeName] = {
          type: new GraphQLList(finalTypeDefs[typeName]),
          args: {
            filter: { type: inputTypeDefs[filterTypeName] },
            orderBy: { type: orderByTypeDefs[orderByTypeName] },
          },
          resolve: async (_, { filter, orderBy }) => {
            const client = await this.adminPool.connect();
            try {
              const whereClauses = [];
              const variables = [];
              const params = [];
              if (filter) {
                Object.entries(filter).forEach(([field, value], index) => {
                  // Need to handle _near first as the input value is an array
                  if (field.endsWith("_near")) {
                    // Vector similarity query
                    const field_name = field.replace("_near", "");
                    variables.push(
                      `${field_name} <=> $${index + 1} AS ${field_name}_simil`
                    );
                    params.push(`[${value.join(",")}]`);
                  } else if (Array.isArray(value)) {
                    whereClauses.push(
                      `${field} IN (${value.map((v, i) => `$${index + i + 1}`).join(", ")})`
                    );
                    params.push(...value);
                  } else if (field.endsWith("_eq")) {
                    whereClauses.push(
                      `${field.replace("_eq", "")} = $${index + 1}`
                    );
                    params.push(value);
                  } else if (typeof value === "string" && value.includes("%")) {
                    whereClauses.push(`${field} ILIKE $${index + 1}`);
                    params.push(value);
                  } else if (field.endsWith("_eq")) {
                    whereClauses.push(
                      `${field.replace("_eq", "")} = $${index + 1}`
                    );
                    params.push(value);
                  } else if (field.endsWith("_ne")) {
                    whereClauses.push(
                      `${field.replace("_ne", "")} != $${index + 1}`
                    );
                    params.push(value);
                  } else if (field.endsWith("_gt")) {
                    whereClauses.push(
                      `${field.replace("_gt", "")} > $${index + 1}`
                    );
                    params.push(value);
                  } else if (field.endsWith("_lt")) {
                    whereClauses.push(
                      `${field.replace("_lt", "")} < $${index + 1}`
                    );
                    params.push(value);
                  } else if (field.endsWith("_gte")) {
                    whereClauses.push(
                      `${field.replace("_gte", "")} >= $${index + 1}`
                    );
                    params.push(value);
                  } else if (field.endsWith("_lte")) {
                    whereClauses.push(
                      `${field.replace("_lte", "")} <= $${index + 1}`
                    );
                    params.push(value);
                  } else if (field.endsWith("_like")) {
                    whereClauses.push(
                      `${field.replace("_like", "")} LIKE $${index + 1}`
                    );
                    params.push(value);
                  } else if (field.endsWith("_in")) {
                    whereClauses.push(
                      `${field.replace("_in", "")} IN (${value.map((v, i) => `$${index + i + 1}`).join(", ")})`
                    );
                    params.push(...value);
                  } else if (field.endsWith("_nin")) {
                    whereClauses.push(
                      `${field.replace("_nin", "")} NOT IN (${value.map((v, i) => `$${index + i + 1}`).join(", ")})`
                    );
                    params.push(...value);
                  } else {
                    whereClauses.push(`${field} = $${index + 1}`);
                    params.push(value);
                  }
                });
              }

              const query = `
                SELECT * 
                  ${variables.length ? ", " + variables.join(",") : ""} 
                FROM 
                  ${modelId}
                ${whereClauses.length ? `WHERE ` + whereClauses.join(" AND ") : ""}
                ${orderBy ? `ORDER BY "${orderBy.field}" ${orderBy.direction}` : ""}
                LIMIT 50`;
              const result = await client.query(query, params);
              return result.rows;
            } finally {
              client.release();
            }
          },
        };
      }
    });
    return queryFields;
  }

  // Resolvers are now set up in the GraphQL schema itself
  async setupResolvers() {
    return {};
  }

  async upsertRaw(tableName, variables) {
    // Helper function to quote all column names
    const quoteField = (field) => `"${field}"`;

    const fields = Object.keys(variables);
    const values = Object.values(variables).map((value) =>
      typeof value === "object" && value !== null
        ? JSON.stringify(value)
        : value
    );

    const updateFields = fields.filter((field) => field !== "stream_id");

    // Building the query
    const queryText = `
      INSERT INTO ${tableName} (${fields.map(quoteField).join(", ")})
      VALUES (${fields.map((_, index) => `$${index + 1}`).join(", ")})
      ON CONFLICT (stream_id)
      DO UPDATE SET ${updateFields.map((field) => `${quoteField(field)} = EXCLUDED.${quoteField(field)}`).join(", ")}
      RETURNING *;
    `;

    const client = await this.adminPool.connect();
    try {
      await client.query(queryText, values);
      return true;
    } catch (e) {
      if (e.code === "42P01") {
        throw "TABLE_NOT_FOUND";
      }

      throw e;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  }

  /** Will try to insert variable in the model table */
  async upsert(model, content, pluginsData) {
    if (model === "kh4q0ozorrgaq2mezktnrmdwleo1d") {
      console.log("Stream is a model, we index the model.");
      const indexed = await this.indexModel(content.stream_id);
      if (!indexed) {
        return false;
      }

      return true;
    }

    const variables = {
      ...content,
      plugins_data: pluginsData,
    };

    // Retrieving table name from mapping
    const tableName = model;

    /** Try to insert stream in the corresponding table */
    try {
      await this.upsertRaw(tableName, variables);
      logger.debug(
        cliColors.text.green,
        `✅ Upserted stream `,
        cliColors.reset,
        variables.stream_id,
        cliColors.text.cyan,
        " in ",
        cliColors.reset,
        tableName
      );
      return true;
    } catch (e) {
      if (
        e === "TABLE_NOT_FOUND" &&
        model !== "kh4q0ozorrgaq2mezktnrmdwleo1d"
      ) {
        // Trigger indexing of new model with a callback to retry indexing this stream
        try {
          await this.indexModel(model);
        } catch (err) {
          console.error(
            `Error inserting stream ${variables.stream_id}`,
            `Reason: Error indexing model: ${model}`,
            err
          );
          return false;
        }

        return this.upsert(model, content, pluginsData);
      } else {
        logger.error(
          cliColors.text.red,
          `Error inserting stream ${variables.stream_id}`,
          cliColors.reset,
          ` : in ${tableName}`,
          e.message
        );
      }
    }

    return false;
  }

  /** Will create a new database */
  async createDatabase(name) {
    const client = await this.adminPool.connect();
    try {
      // SQL query to create a new database with the user id name
      await client.query(`CREATE DATABASE "${name}"`);
      logger.debug(`Database ${name} created successfully`);
    } catch (error) {
      logger.error(`Could not create database ${name}`, error);
    } finally {
      // Make sure to close the client connection
      client.release();
    }
  }

  async bootstrapTables() {
    const tables = [
      {
        model: "kh4q0ozorrgaq2mezktnrmdwleo1d",
        title: "models_indexed",
        uniqueFormattedTitle: "models_indexed",
        fields: [
          { name: "stream_id", type: "TEXT PRIMARY KEY" }, // Added automatically
          { name: "controller", type: "TEXT" }, // Added automatically
          { name: "name", type: "TEXT" },
          { name: "mapped_name", type: "TEXT" },
          { name: "content", type: "JSONB" },
          { name: "indexed_at", type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" }, // Added automatically
        ],
      },
    ];

    for (const table of tables) {
      try {
        await this.createTable(
          table.model,
          table.fields,
          table.uniqueFormattedTitle
        );
      } catch (err) {
        console.error(
          `Error bootstrapping table ${table.title || table.uniqueFormattedTitle}: `,
          err
        );
      }
    }
  }

  /** Will prepare the indexing of a model by creating the corresponding table in our database */
  async indexModel(model, callback = null) {
    if (model === "kh4q0ozorrgaq2mezktnrmdwleo1d") {
      return true;
    }

    // Step 1: Load model details if not genesis stream
    const stream =
      await global.indexingService.ceramic.client.loadStream(model);

    const content = stream.content;
    if (!content?.schema?.properties) {
      logger.debug(
        "This stream is either not valid or not a supported model:",
        content
      );

      return false;
    }

    const [postgresFields, postgresIndexes] =
      await this.jsonSchemaToPostgresFields(content.schema.properties);

    const title = content.name ? content.name : content.title;
    const uniqueFormattedTitle = await this.generateUniqueTableName(title);

    // Step 2: Convert model variables in SQL columns
    const fields = [
      { name: "stream_id", type: "TEXT PRIMARY KEY" }, // Added automatically
      { name: "controller", type: "TEXT" }, // Added automatically
      ...postgresFields,
      { name: "_metadata_context", type: "TEXT" }, // Added automatically
      { name: "plugins_data", type: "JSONB" }, // Added automatically
      { name: "indexed_at", type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" }, // Added automatically
    ];

    // Step 3: Build SQL query and run
    console.log("In indexModel, callback is:", callback);
    await this.createTable(
      model,
      fields,
      uniqueFormattedTitle,
      callback,
      postgresIndexes
    );

    await this.upsertRaw("kh4q0ozorrgaq2mezktnrmdwleo1d", {
      stream_id: stream.id.toString(),
      controller: stream.metadata.controller,
      name: content.name ? content.name : content.title,
      mapped_name: content.mapped_name,
      content: content,
    });

    return true;
  }

  /**
   * Will create a new table dynamically based on the model id and fields
   */
  async createTable(
    model,
    fields,
    uniqueFormattedTitle,
    callback,
    indexes = []
  ) {
    console.log("Enter createTable for model:", model);
    // Construct the columns part of the SQL statement
    // Construct the columns part of the SQL statement

    const columns = fields
      .map((field) => {
        // Add UNIQUE constraint if field.unique is true
        const uniqueConstraint = field.unique ? " UNIQUE" : "";
        return `"${field.name}" ${field.type}${uniqueConstraint}`;
      })
      .join(", ");

    // Construct the full SQL statement for table creation
    const createTableQuery = `
CREATE TABLE IF NOT EXISTS "${model}" (${columns});
CREATE INDEX IF NOT EXISTS "${model}_stream_id_idx" ON "${model}" ("stream_id");
CREATE INDEX IF NOT EXISTS "${model}_controller_idx" ON "${model}" ("controller");
CREATE INDEX IF NOT EXISTS "${model}_indexed_at_idx" ON "${model}" ("indexed_at");
${indexes
  .map(({ field: column, name, method, storage, predicate }) => {
    return `CREATE INDEX IF NOT EXISTS "${model}_${name || `${column}_idx`}" ON "${model}" ${method ? `USING ${method}` : ``} (${column}) ${storage ? `WITH ${storage}` : ``} ${predicate ? `WHERE ${predicate}` : ``};`;
  })
  .join("\n")}
    `;

    console.log("createTableQuery:", createTableQuery);

    const client = await this.adminPool.connect();
    try {
      // Execute the table creation query
      await client.query(createTableQuery);

      // Keep track of new table name
      this.mapTableName(model, uniqueFormattedTitle);

      // Will refresh GraphQL schema
      if (this.slot) {
        await refreshGraphQLSchema(this, this.slot);
      }

      // Will trigger a callback if provided by the parent function
      if (callback) {
        console.log("Calling callback:", callback);
        callback();
      }

      console.log(
        cliColors.text.cyan,
        `🧩 Created table:`,
        cliColors.reset,
        uniqueFormattedTitle
      );

      return true;
    } catch (err) {
      if (Number(err.code) === 23505) {
        // Concurrent CREATE TABLE (caused by /index/model call together with discovery)
        // Assume the table has been created
        return true;
      }

      console.log(
        cliColors.text.red,
        "Error creating new table.",
        cliColors.reset,
        err.stack
      );

      return false;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  }

  /**
   * Will create a unique table name based on the model's title while making sure it's unique.
   */
  async generateUniqueTableName(title) {
    const formattedTitle = snakeCase(title);

    let counter = 1;
    let uniqueFormattedTitle = formattedTitle;

    while (await this.doesTableExist(uniqueFormattedTitle)) {
      uniqueFormattedTitle = `${formattedTitle}_${counter}`;
      counter++;
    }

    return uniqueFormattedTitle;
  }

  /**
   * Checks if a table exists in the database.
   */
  async doesTableExist(tableName) {
    // Retrieve current settings
    let settings = getOrbisDBSettings(this.slot);

    try {
      const modelsMapping = settings.models_mapping;
      // Check if tableName exists as a value in models_mapping
      if (modelsMapping && Object.values(modelsMapping).includes(tableName)) {
        return true; // Table exists in models_mapping
      }
      return false; // Table not found in models_mapping
    } catch (e) {
      logger.error(
        cliColors.text.red,
        "❌ Error checking table existence:",
        cliColors.reset,
        e
      );
      return false;
    }
  }

  /** Will make sure we keep track of the relationship between the model id and readable table name */
  async mapTableName(model, title) {
    // Retrieve current settings
    let settings = getOrbisDBSettings(this.slot);

    // Check if models_mapping exists, if not, create it
    if (!settings.models_mapping) {
      settings.models_mapping = {};
    }

    // Assign new configuration values
    settings.models_mapping[model] = title;

    // Rewrite the settings file
    updateOrbisDBSettings(settings, this.slot);
  }

  /** Will query DB Schema with admin user */
  async query_schema() {
    // Build schema query
    let query = `SELECT
          t.table_name,
          'TABLE' as type,
          NULL as view_definition,
          json_agg(json_build_object('column_name', c.column_name, 'data_type', c.data_type)) as columns
        FROM
          information_schema.tables t
          LEFT JOIN information_schema.columns c
          ON t.table_name = c.table_name
        WHERE
          t.table_type = 'BASE TABLE'
          AND t.table_schema = 'public'
        GROUP BY
          t.table_name

        UNION ALL

        SELECT
          v.table_name,
          'VIEW' as type,
          v.view_definition,
          json_agg(json_build_object('column_name', c.column_name, 'data_type', c.data_type)) as columns
        FROM
          information_schema.views v
          LEFT JOIN information_schema.columns c
          ON v.table_name = c.table_name
        WHERE
          v.table_schema = 'public'
        GROUP BY
          v.table_name, v.view_definition;`;

    // Perform query and return results
    const client = await this.adminPool.connect();
    try {
      const res = await client.query(query);
      return { data: res.rows };
    } catch (e) {
      logger.error(
        cliColors.text.red,
        `❌ Error executing schema query:`,
        cliColors.reset,
        e.message
      );
      return false;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  }

  /** Will run any query and return the results */
  async query(userQuery, params) {
    const defaultLimit = 100;
    let modifiedQuery = await this.replaceTableNames(userQuery);

    // Check if the query already contains a LIMIT clause
    /*if (!/LIMIT \d+/i.test(userQuery)) {
      modifiedQuery += ` LIMIT ${defaultLimit}`;
    }*/
    let res;
    let error;
    const client = await this.adminPool.connect();
    try {
      res = await client.query(modifiedQuery, params);
    } catch (e) {
      logger.error(
        cliColors.text.red,
        `❌ Error executing query:`,
        cliColors.reset,
        e.message
      );
      error = e.message;
    } finally {
      // Release the client back to the pool
      client.release();
    }

    /** Return result */
    if (res) {
      return { data: res };
    } else {
      return { error: error };
    }
  }

  /** Will replace all the table names passed by the user with the mapped tabled name */
  async replaceTableNames(sql) {
    const tableNamePattern = /FROM\s+"?(\w+)"?/gi;
    let resultSql = sql;
    let match;

    while ((match = tableNamePattern.exec(sql)) !== null) {
      const originalTableName = match[1];
      let replacementValue = getTableModelId(originalTableName);
      if (!replacementValue) {
        replacementValue = originalTableName;
      }
      logger.debug(
        "Switching " + originalTableName + " with " + replacementValue
      );
      const regex = new RegExp(`\\b${originalTableName}\\b`, "g");
      resultSql = resultSql.replace(regex, replacementValue);
    }

    return resultSql;
  }

  /** Query a whole table */
  async queryGlobal(table, page, orderByIndexedAt = true, context) {
    const records = 100;
    const offset = (page - 1) * records;

    // Base query
    let queryText = `SELECT * FROM ${table}`;

    // Add filtering by context if context is provided
    if (
      context &&
      context != "global" &&
      table != "kh4q0ozorrgaq2mezktnrmdwleo1d"
    ) {
      queryText += ` WHERE _metadata_context = ${context}`;
    }

    // Add ordering and pagination
    if (orderByIndexedAt) {
      queryText += ` ORDER BY indexed_at DESC`;
    }

    queryText += ` LIMIT ${records} OFFSET ${offset}`;

    // Query for total count
    const countQuery = `SELECT COUNT(*) FROM ${table}`;

    // Query to retrieve table comment
    const commentQuery = `
      SELECT obj_description(to_regclass('${table}')::oid) AS comment
      FROM pg_class
      WHERE relname = '${table}';`;

    const client = await this.adminPool.connect();
    try {
      const res = await client.query(queryText);
      const countResult = await client.query(countQuery);
      const commentResult = await client.query(commentQuery);

      // Extracting total count from countResult
      const totalCount = countResult.rows[0].count;

      // Extracting the comment (which includes the title)
      const title = commentResult.rows[0]?.comment || "";

      return { data: res, totalCount, title };
    } catch (e) {
      logger.error(`Error querying data from ${table}:`, e.message);
      return false;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  }

  /** Will convert the properties from the JSON schemas into Postgre's fields to create the new table */
  async jsonSchemaToPostgresFields(jsonSchema) {
    const postgresFields = [];
    const postgresIndexes = [];

    for (const key in jsonSchema) {
      const value = jsonSchema[key];

      const customDefinition = await this.parseCustomFieldDefinition(
        key,
        value
      );

      if (customDefinition) {
        if (customDefinition.index) {
          postgresIndexes.push(customDefinition.index);
        }
      }

      // Determine PostgreSQL data type based on JSON schema
      let postgresType;

      // Check for specific "embedding" field
      if (customDefinition?.type) {
        postgresType = customDefinition.type;
      } else if (Array.isArray(value.type)) {
        if (value.type.includes("object") || value.type.includes("array")) {
          postgresType = "JSONB";
        } else {
          // Handles basic types (string, number) with possible nulls
          postgresType = this.jsonTypeToPostgresType(value.type[0]);
        }
      } else {
        postgresType = this.jsonTypeToPostgresType(value.type);
      }

      // Detect additional fields using the $comment field
      let additionalParameters;
      let unique = false;
      let convert_to;

      if (value.$comment) {
        // Try to parse comment field
        try {
          additionalParameters = JSON.parse(value.$comment);
        } catch (e) {
          console.log("Error parsing $comment field:", e);
        }

        if (additionalParameters) {
          // Handle Unique
          unique = additionalParameters.unique;

          // Handle convert_to
          convert_to = additionalParameters.convert_to;
          if (convert_to === "object" || convert_to === "array") {
            postgresType = "JSONB";
          }
        }
      }

      postgresFields.push({ name: key, type: postgresType, unique: unique });
    }

    return [postgresFields, postgresIndexes];
  }

  async #checkExtensionsRequirement(requiredExtensions) {
    if (!requiredExtensions || !requiredExtensions.length) {
      return true;
    }

    let availableExtensions = await this.fetchExtensions();

    for (const ext of requiredExtensions) {
      const exists = availableExtensions.find(
        (extension) => extension.name === ext
      );

      if (!exists) {
        return false;
      }

      if (!exists.installed) {
        try {
          await this.enableExtension(exists.name);
          console.log(
            "Enabled extension:",
            exists.name,
            "| Refreshing extension list..."
          );
          availableExtensions = await this.fetchExtensions();
        } catch (e) {
          console.error("Failed to enable extension", e);
          return false;
        }
      }
    }

    return true;
  }

  async parseCustomFieldDefinition(name, definition) {
    if (!definition.examples?.length) {
      return false;
    }

    const customDefinitionObject = definition.examples.find(
      (value) => typeof value === "object" && "x-orbisdb" in value
    );
    if (!customDefinitionObject) {
      return false;
    }

    const customDefinition =
      customDefinitionObject["x-orbisdb"].postgres ||
      customDefinitionObject["x-orbisdb"].pg;

    if (!customDefinition || typeof customDefinition !== "object") {
      return false;
    }

    const extensionSupport = await this.#checkExtensionsRequirement(
      customDefinition.extensions || []
    );

    let customIndex;
    if (!customDefinition.index) {
      customIndex = false;
    } else if (
      typeof customDefinition.index === "boolean" ||
      !extensionSupport
    ) {
      customIndex = customDefinition.index ? { field: name } : false;
    } else if (typeof customDefinition.index === "object") {
      customIndex = {
        ...customDefinition.index,
        field: name,
      };
    }

    return {
      type:
        extensionSupport && typeof customDefinition.type === "string"
          ? customDefinition.type
          : false,
      index: customIndex,
    };
  }

  /** Simple converter between json format nomenclature and Postgre */
  jsonTypeToPostgresType(jsonType) {
    switch (jsonType) {
      case "string":
        return "TEXT";
      case "number":
        return "NUMERIC";
      case "integer":
        return "INTEGER";
      case "boolean":
        return "BOOLEAN";
      case "object":
        return "JSONB";
      case "array":
        return "JSONB"; // For now we are storing all arrays as JSONB but with additional logic we could determine the exact types such as TEXT[]....
      case "date":
        return "DATE";
      case "datetime":
        return "TIMESTAMP";
      case "uuid":
        return "UUID";
      case "binary":
        return "BYTEA";
      default:
        return "TEXT"; // Default fallback for unsupported or unrecognized types.
    }
  }
}
