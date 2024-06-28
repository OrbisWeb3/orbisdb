import postgresql from "pg";
import { buildSchema, GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLFloat, GraphQLBoolean, GraphQLList, GraphQLInputObjectType, GraphQLNonNull, GraphQLSchema } from 'graphql';
import { GraphQLJSONObject } from 'graphql-scalars';

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
import { refreshGraphQLSchema } from "../index.js";

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
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
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

// Helper function to map field types to GraphQL types
getGraphQLType(fieldType) {
  switch (fieldType) {
    case 'character varying':
    case 'text':
      return GraphQLString;
    case 'integer':
      return GraphQLInt;
    case 'boolean':
      return GraphQLBoolean;
    case 'float8':
      return GraphQLFloat;
    case 'json':
    case 'jsonb':
      return GraphQLJSONObject;
    default:
      if (fieldType.startsWith('_')) {
        const elementType = this.getGraphQLType(fieldType.substring(1));
        return new GraphQLList(elementType || GraphQLString);
      } else {
        return GraphQLString;
      }
  }
}

  /** Function to generate the GraphQL schema using the DB schema and relations specified by the user */
  async generateGraphQLSchema() {
    const settings = getOrbisDBSettings(this.slot);
    const dbSchema = await this.fetchDBSchema();
    const modelsMapping = settings.models_mapping || {};
    const relations = settings.relations || {};

    let typeDefs = {};
    let inputTypeDefs = {};

    // Define all types initially
    for (const [modelId, { columns }] of Object.entries(dbSchema)) {
      const typeName = modelsMapping[modelId] || modelId;
      const fields = {};
      const inputFields = {};

      for (const [fieldName, fieldType] of Object.entries(columns)) {
        const graphqlType = this.getGraphQLType(fieldType);
        fields[fieldName] = { type: graphqlType };
        inputFields[fieldName] = { type: graphqlType };
      }

      typeDefs[typeName] = () => ({
        name: typeName,
        fields
      });

      inputTypeDefs[`${typeName}Filter`] = new GraphQLInputObjectType({
        name: `${typeName}Filter`,
        fields: inputFields,
      });
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
              const relatedTypeName = modelsMapping[relation.referencedTable] || relation.referencedTable;
              relFields[relation.referenceName] = {
                type: finalTypeDefs[relatedTypeName],
                resolve: async (source) => {
                  const client = await this.adminPool.connect();
                  try {
                    const referencedTable = relation.referencedTable;
                    const referencedColumn = relation.referencedColumn;
                    const value = source[relation.column]; // Ensure this source key matches your GraphQL type field names
                    const query = `SELECT * FROM ${referencedTable} WHERE ${referencedColumn} = $1 LIMIT 1`;
                    const params = [value]; // Safe parameterization
                    const result = await client.query(query, params);
                    return result.rows[0];
                  } finally {
                    client.release();
                  }
                }
              };
            }
          }
          return { ...fields.fields, ...relFields }; // Combine relational fields with regular fields
        }
      });
    }

    // Construct the main query type with resolve functions
    const queryFields = {};
    for (const [modelId] of Object.entries(dbSchema)) {
      const typeName = modelsMapping[modelId] || modelId;
      queryFields[typeName] = {
        type: new GraphQLList(finalTypeDefs[typeName]),
        args: {
          filter: { type: inputTypeDefs[`${typeName}Filter`] }
        },
        resolve: async (_, { filter }) => {
          const client = await this.adminPool.connect();
          try {
            let query = `SELECT * FROM ${modelId}`;
            const whereClauses = [];
            if (filter) {
              Object.entries(filter).forEach(([field, value]) => {
                if (Array.isArray(value)) {
                  whereClauses.push(`${field} IN (${value.map(v => `'${v}'`).join(', ')})`);
                } else if (typeof value === 'string' && value.includes('%')) {
                  whereClauses.push(`${field} ILIKE '${value}'`);
                } else {
                  whereClauses.push(`${field} = '${value}'`);
                }
              });
              if (whereClauses.length > 0) {
                query += ` WHERE ${whereClauses.join(' AND ')}`;
              }
            }
            query += ` LIMIT 50`; // Adjust LIMIT as needed
            const result = await client.query(query);
            return result.rows;
          } finally {
            client.release();
          }
        }
      };
    }
    // Return the fully constructed GraphQL schema
    const queryType = new GraphQLObjectType({
      name: 'Query',
      fields: queryFields
    });

    return new GraphQLSchema({
      query: queryType
    });
  }

  // Method to prepare query fields
  prepareQueryFields(modelsMapping, dbSchema, finalTypeDefs, inputTypeDefs) {
    const queryFields = {};
    Object.entries(dbSchema).forEach(([modelId]) => {
      const typeName = modelsMapping[modelId] || modelId;
      const filterTypeName = `${typeName}Filter`;
  
      if (inputTypeDefs[filterTypeName]) {
        queryFields[typeName] = {
          type: new GraphQLList(finalTypeDefs[typeName]),
          args: {
            filter: { type: inputTypeDefs[filterTypeName] },
          },
          resolve: async (_, { filter }) => {
            const client = await this.adminPool.connect();
            try {
              let query = `SELECT * FROM ${modelId}`;
              const whereClauses = [];
              if (filter) {
                Object.entries(filter).forEach(([field, value]) => {
                  if (Array.isArray(value)) {
                    whereClauses.push(`${field} IN (${value.map(v => `'${v}'`).join(', ')})`);
                  } else if (typeof value === 'string' && value.includes('%')) {
                    whereClauses.push(`${field} ILIKE '${value}'`);
                  } else {
                    whereClauses.push(`${field} = '${value}'`);
                  }
                });
                if (whereClauses.length > 0) {
                  query += ` WHERE ${whereClauses.join(' AND ')}`;
                }
              }
              query += ` LIMIT 50`;
              const result = await client.query(query);
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

  /** Will try to insert variable in the model table */
  async upsert(model, content, pluginsData) {
    let variables;
    if (model != "kh4q0ozorrgaq2mezktnrmdwleo1d") {
      // Generate variables to insert
      variables = {
        ...content,
        plugins_data: pluginsData,
      };
    } else {
      // Inserting a model in our models_indexed table
      variables = {
        stream_id: content.stream_id,
        controller: content.controller,
        name: content.name ? content.name : content.title,
        mapped_name: content.mapped_name,
        content: content,
      };
    }

    // Extracting field names and values from data
    const fields = Object.keys(variables);
    const values = Object.values(variables).map((value) =>
      typeof value === "object" && value !== null
        ? JSON.stringify(value)
        : value
    );

    // Define which fields to update in case of conflict
    const updateFields = fields.filter((field) => field !== "stream_id");

    // Retrieving table name from mapping
    let tableName = model;

    // Building the query
    const queryText = `
    INSERT INTO ${tableName} (${fields.join(", ")})
    VALUES (${fields.map((_, index) => `$${index + 1}`).join(", ")})
    ON CONFLICT (stream_id)
    DO UPDATE SET ${updateFields.map((field) => `${field} = EXCLUDED.${field}`).join(", ")}
    RETURNING *;`;

    /** If stream is a model we trigger the indexing */
    if (model == "kh4q0ozorrgaq2mezktnrmdwleo1d") {
      this.indexModel(content.stream_id);
    }

    /** Try to insert stream in the corresponding table */
    let res;
    const client = await this.adminPool.connect();
    try {
      res = await client.query(queryText, values);
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
    } catch (e) {
      if (e.code === "42P01") {
        // Trigger indexing of new model with a callback to retry indexing this stream
        this.indexModel(model, () => this.upsert(model, content, pluginsData));
      } else {
        logger.error(
          cliColors.text.red,
          `Error inserting stream ${variables.stream_id}:`,
          cliColors.reset,
          e.message
        );
      }
    } finally {
      // Release the client back to the pool
      client.release();
    }

    if (res) {
      return true;
    } else {
      return false;
    }
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

  /** Will prepare the indexing of a model by creating the corresponding table in our database */
  async indexModel(model, callback = null, forced = false) {
    let content;
    let title;
    let uniqueFormattedTitle;
    let fields;

    if (model != "kh4q0ozorrgaq2mezktnrmdwleo1d") {
      // Step 1: Load model details if not genesis stream
      let stream = await global.indexingService.ceramic.client.loadStream(model);
      content = stream.content;
      if (content?.schema?.properties) {
        let postgresFields = this.jsonSchemaToPostgresFields(
          content.schema.properties
        );
        title = content.name ? content.name : content.title;

        // Generate a unique table name
        uniqueFormattedTitle = await this.generateUniqueTableName(title);

        // Step 2: Convert model variables in SQL columns
        fields = [
          { name: "stream_id", type: "TEXT PRIMARY KEY" }, // Added automatically
          { name: "controller", type: "TEXT" }, // Added automatically
          ...postgresFields,
          { name: "_metadata_context", type: "TEXT" }, // Added automatically
          { name: "plugins_data", type: "JSONB" }, // Added automatically
          { name: "indexed_at", type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" }, // Added automatically
        ];
      } else {
        logger.debug(
          "This stream is either not valid or not a supported model:",
          content
        );
      }
    } else {
      title = "models_indexed";
      uniqueFormattedTitle = "models_indexed";
      fields = [
        { name: "stream_id", type: "TEXT PRIMARY KEY" }, // Added automatically
        { name: "controller", type: "TEXT" }, // Added automatically
        { name: "name", type: "TEXT" },
        { name: "mapped_name", type: "TEXT" },
        { name: "content", type: "JSONB" },
        { name: "indexed_at", type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" }, // Added automatically
      ];
    }

    // Step 3: Build SQL query and run
    await this.createTable(model, fields, uniqueFormattedTitle, callback);

    // Step 4: Insert new row in models_indexed table
    if (model != "kh4q0ozorrgaq2mezktnrmdwleo1d" && !forced) {
      this.upsert(
        "kh4q0ozorrgaq2mezktnrmdwleo1d",
        {
          stream_id: model,
          controller: content.controller,
          name: title,
          mapped_name: uniqueFormattedTitle,
          content: content,
        },
        null
      );
    }

    return true;
  }

  /**
   * Will create a new table dynamically based on the model id and fields
   */
  async createTable(model, fields, uniqueFormattedTitle, callback) {
    // Construct the columns part of the SQL statement
    const columns = fields
      .map((field) => `"${field.name}" ${field.type}`)
      .join(", ");

    // Construct the full SQL statement for table creation
    const createTableQuery = `CREATE TABLE IF NOT EXISTS "${model}" (${columns});
      
      CREATE INDEX IF NOT EXISTS "${model}_stream_id_idx" ON "${model}" ("stream_id");
      CREATE INDEX IF NOT EXISTS "${model}_controller_idx" ON "${model}" ("controller");
      CREATE INDEX IF NOT EXISTS "${model}_indexed_at_idx" ON "${model}" ("indexed_at");`;

    const client = await this.adminPool.connect();
    try {
      // Execute the table creation query
      await client.query(createTableQuery);
      // Keep track of new table name
      this.mapTableName(model, uniqueFormattedTitle);

      logger.debug(
        cliColors.text.cyan,
        `🧩 Created table:`,
        cliColors.reset,
        uniqueFormattedTitle
      );

      // Will refresh GraphQL schema
      refreshGraphQLSchema(this, this.slot);

      // Will trigger a callback if provided by the parent function
      if (callback) {
        console.log("Calling callback:", callback);
        callback();
      }
    } catch (err) {
      logger.error(
        cliColors.text.red,
        "Error creating new table.",
        cliColors.reset,
        err.stack
      );
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
    if (context && context != "global" && table != "kh4q0ozorrgaq2mezktnrmdwleo1d") {
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

  /** Will convert the properties from the JSON schemas into Postegre's fields to create the new table */
  jsonSchemaToPostgresFields(jsonSchema) {
    const postgresFields = [];

    for (const key in jsonSchema) {
      const value = jsonSchema[key];

      // Determine PostgreSQL data type based on JSON schema
      let postgresType;
      if (Array.isArray(value.type)) {
        if (value.type.includes("object") || value.type.includes("array")) {
          postgresType = "JSONB";
        } else {
          // Handles basic types (string, number) with possible nulls
          postgresType = this.jsonTypeToPostgresType(value.type[0]);
        }
      } else {
        postgresType = this.jsonTypeToPostgresType(value.type);
      }

      postgresFields.push({ name: key.toLowerCase(), type: postgresType });
    }

    return postgresFields;
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
