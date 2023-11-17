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

    //this.renameTable("kjzl6hvfrbw6c8tvfz7lavsv4niyx2t5fypwmg8ovtrulqwke6gmj0olj7y4r0d", "OamoProfileV1");
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
      let title = content.name ? content.name : content.title;

      // Step 2: Convert model variables in SQL columns
      const fields = [
        { name: 'stream_id', type: 'TEXT PRIMARY KEY' }, // Added automatically
        { name: 'controller', type: 'TEXT' }, // Added automatically
        ...postgresFields,
        { name: 'plugins_data', type: 'JSONB' }, // Added automatically
        { name: 'indexed_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' } // Added automatically
      ];

      // Step 3: Build SQL query and run
      await this.createTable(model, fields, title, callback);
    } else {
      console.log("This stream is either not valid or not a supported model:", content);
    }
  }

  /** Will force rename a table using the COMMENT field */
  async renameTable(model, title) {
    // Construct the COMMENT ON TABLE SQL statement
    const commentQuery = `COMMENT ON TABLE ${model} IS '${title}';`;

    await this.pool.query(commentQuery);
    console.log("Comment added to table");
  }

  /** Will create a new table dynamically based on the model id and fields */
  async createTable(model, fields, title, callback) {
    // Construct the columns part of the SQL statement
    const columns = fields.map(field => `${field.name} ${field.type}`).join(', ');

    // Construct the full SQL statement for table creation
    const createTableQuery = `CREATE TABLE IF NOT EXISTS ${model} (${columns})`;

    // Construct the COMMENT ON TABLE SQL statement
    const commentQuery = `COMMENT ON TABLE ${model} IS '${title}';`;

    try {
      // Execute the table creation query
      await this.pool.query(createTableQuery);
      console.log("Table created");

      // Execute the comment query
      if(title) {
        await this.pool.query(commentQuery);
        console.log("Comment added to table");
      }

      // Will trigger a callback if provided by the parent function
      if(callback) {
        callback();
      }
    } catch (err) {
      console.error("Error in table creation or adding comment", err.stack);
    }
  }

  /** Will run any query and return the results */
  async query(userQuery) {
    const defaultLimit = 100;
    let modifiedQuery = userQuery;

    // Check if the query already contains a LIMIT clause
    /*if (!/LIMIT \d+/i.test(userQuery)) {
      modifiedQuery += ` LIMIT ${defaultLimit}`;
    }*/

    try {
      const res = await this.pool.query(userQuery);
      return { data: res };
    } catch (e) {
      console.error(`Error executing query:`, e.message);
      return false;
    }
  }

  /** Will try to insert variable in the model table */
  async queryGlobal(table, page) {
    const records = 100;
    const offset = (page - 1) * records;

    // Query for paginated data
    const queryText = `SELECT * FROM ${table} ORDER BY indexed_at DESC LIMIT ${records} OFFSET ${offset}`;

    // Query for total count
    const countQuery = `SELECT COUNT(*) FROM ${table}`;

    // Query to retrieve table comment
    const commentQuery = `
      SELECT obj_description(to_regclass('${table}')::oid) AS comment
      FROM pg_class
      WHERE relname = '${table}';
    `;

    try {
      const res = await this.pool.query(queryText);
      const countResult = await this.pool.query(countQuery);
      const commentResult = await this.pool.query(commentQuery);

      // Extracting total count from countResult
      const totalCount = countResult.rows[0].count;

      // Extracting the comment (which includes the title)
      const title = commentResult.rows[0]?.comment || '';

      return { data: res, totalCount, title };
    } catch (e) {
      console.error(`Error querying data from ${table}:`, e.message);
      return false;
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
      case 'integer':
        return 'INTEGER';
      case 'boolean':
        return 'BOOLEAN';
      case 'object':
        return 'JSONB';
      case 'array':
        return 'JSONB'; // For now we are storing all arrays as JSONB but with additional logic we could determine the exact types such as TEXT[]....
      case 'date':
        return 'DATE';
      case 'datetime':
        return 'TIMESTAMP';
      case 'uuid':
        return 'UUID';
      case 'binary':
        return 'BYTEA';
      default:
        return 'TEXT'; // Default fallback for unsupported or unrecognized types.
    }
  }
}
