import postgresql from 'pg';

const { Pool } = postgresql;


/**
 * DB implementation to index streams with Postgre
 */
export default class Postgre {
  constructor(user, database, password, host, port) {
    console.log("Initializing PostgreSQL DB with user:", user);
    this.connection = null;

    // Instantiate new pool for postgresql database
    this.pool = new Pool({
      user,
      database,
      password,
      host,
      port,
      ssl: {
        rejectUnauthorized: false // Or configure a proper SSL certificate if available
      }
    });
  }

  /** Will try to insert variable in the model table */
  async insert(model, content, pluginsData) {
    // Generate variables to insert
    let variables = {
      ...content,
      plugins_data: pluginsData
    }

    // Extracting field names and values from data
    const fields = Object.keys(variables);
    const values = Object.values(variables);

    // Constructing the query
    const queryText = `
      INSERT INTO ${model} (${fields.join(', ')})
      VALUES (${fields.map((_, index) => `$${index + 1}`).join(', ')})
      RETURNING *`;

    try {
      const res = await this.pool.query(queryText, values);
      console.log(`Stream: ${variables.stream_id} inserted in ${model}.`);
      return true;
    } catch (e) {
      if (e.code === '42P01') {
        console.error(`Table ${model} does not exist, create it:`, e.message);

        // Trigger indexing of new model with a callback to retry indexing this stream
        this.indexModel(model, () => this.insert(model, content, pluginsData));
      } else {
        console.error(`Error inserting stream ${variables.stream_id}:`, e.message);
      }
      return false;
    }
  }

  /** Will prepare the indexing of a model by creating the corresponding table in our database */
  async indexModel(model, callback) {
    console.log("Enter indexModel with:", model);
    // Step 1: Load model details
    let { content } = await global.indexingService.ceramic.loadStream(model);
    if(content?.schema?.properties) {

      let postgresFields = this.jsonSchemaToPostgresFields(content.schema.properties);

      // Step 2: Convert model variables in SQL columns
      const fields = [
        { name: 'stream_id', type: 'TEXT PRIMARY KEY' }, // Added automatically
        { name: 'controller', type: 'TEXT' }, // Added automatically
        ...postgresFields,
        { name: 'plugins_data', type: 'JSONB' }, // Added automatically
        { name: 'indexed_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' } // Added automatically
      ];

      // Step 3: Build SQL query and run
      await this.createTable(model, fields, callback);
    } else {
      console.log("This stream is either not valid or not a supported model:", content);
    }
  }

  /** Will create a new table dynamically based on the model id and fields */
  async createTable(model, fields, callback) {
    // Construct the columns part of the SQL statement
    const columns = fields.map(field => `${field.name} ${field.type}`).join(', ');

    // Construct the full SQL statement
    const query = `
      CREATE TABLE IF NOT EXISTS ${model} (
        ${columns}
      )`;

    try {
      const res = await this.pool.query(query);
      console.log("Table created", res);

      // Will trigger a callback if shared by the parent function (can be used to re-try indexing the initial stream)
      if(callback) {
        callback();
      }
    } catch (err) {
      console.error("Error creating table", err.stack);
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
        if (value.type.includes('object')) {
          postgresType = 'JSONB';
        } else {
          // Handles basic types (string, number) with possible nulls
          postgresType = this.jsonTypeToPostgresType(value.type[0]);
        }
      } else {
        postgresType = this.jsonTypeToPostgresType(value.type);
      }

      postgresFields.push({ name: key, type: postgresType });
    }

    return postgresFields;
  }

  /** Simple converter between json format nomenclature and Postgre */
  jsonTypeToPostgresType(jsonType) {
    switch (jsonType) {
      case 'string':
        return 'TEXT';
      case 'number':
        return 'NUMERIC';
      case 'boolean':
        return 'BOOLEAN';
      case 'object':
        return 'JSONB';
      case 'array':
        return 'JSONB';
      default:
        return 'TEXT'; // Default fallback
    }
  }
}
