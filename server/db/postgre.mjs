import postgresql from 'pg';
import { snakeCase } from 'change-case';
import { cliColors } from "../utils/cliColors.mjs"
const { Pool } = postgresql;
import { getOrbisDBSettings, updateOrbisDBSettings, getTableName, getTableModelId } from '../utils/helpers.mjs';

/**
 * DB implementation to index streams with Postgre
 */
export default class Postgre {
  constructor(user, database, password, host, port) {
    try {
      this.connection = null;

      // Instantiate new pool for postgresql database
      this.adminPool = new Pool({
        user,
        database,
        password,
        host,
        port,
        ssl: {
          rejectUnauthorized: false // Or configure a proper SSL certificate if available
        }
      });

      // Create read only user if needed
      this.checkReadOnlyUser(database, host, port);
  
      console.log(cliColors.text.cyan, "🗄️  Initialized PostgreSQL DB with admin user:", cliColors.reset, user) ; 
    } catch(e) {
      console.log(cliColors.text.red, "🗄️  Error initializing PostgreSQL DB with admin user:", cliColors.reset, user, ":", e) ; 
    }
  }

  /** Will create a new read only user to make sure only SELECT queries can be performed from front-end */
  async checkReadOnlyUser(database, host, port) {
    let readOnlyUsername = "read_only_orbisdb_3";
    let readOnlyPassword = "read_only_orbisdb_pw";

    // Check if readonly user exists
    const readOnlyUserExists = await this.checkIfDbUserExists(readOnlyUsername);

    // If read only user doesn't exist we create it
    if(!readOnlyUserExists) {
      const client = await this.adminPool.connect();
      try {
          // Step 1: Create a new user (role)
          await client.query(`CREATE USER ${readOnlyUsername} WITH PASSWORD '${readOnlyPassword}';`);
  
          // Step 2: Grant connect permission on the database
          await client.query(`GRANT CONNECT ON DATABASE ${database} TO ${readOnlyUsername};`);
  
          // Step 3: Grant usage permission on the schema
          await client.query(`GRANT USAGE ON SCHEMA public TO ${readOnlyUsername};`);
  
          // Step 4: Grant select permission on all tables in the schema
          await client.query(`GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${readOnlyUsername};`);
  
          // Make the privileges effective immediately for new tables
          await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ${readOnlyUsername};`);
  
          console.log(cliColors.text.cyan, '👁️  Read-only user created with:', cliColors.reset, readOnlyUsername);
      } catch (err) {
          console.error(cliColors.text.red, '👁️  Error creating read-only user:', cliColors.reset, err.stack);
      } finally {
          client.release();
      }
    }

    // Instantiate new pool for postgresql database
    this.readOnlyPool = new Pool({
      user: readOnlyUsername,
      database,
      password: readOnlyPassword,
      host,
      port,
      ssl: {
        rejectUnauthorized: false // Or configure a proper SSL certificate if available
      }
    });

    console.log(cliColors.text.cyan, '🗄️  Initialized read-only db pool with: ', cliColors.reset, readOnlyUsername);
  }

  // Will check if a specific DB user exists with username
  async checkIfDbUserExists(username) {
    const client = await this.adminPool.connect();
    try {
        const queryText = `SELECT 1 FROM pg_roles WHERE rolname = $1`;
        const res = await client.query(queryText, [username]);
        return res.rowCount > 0;
    } catch (err) {
        console.error('Error querying the database:', err.stack);
        return false;
    } finally {
        client.release();
    }
}

  /** Will try to insert variable in the model table */
  async upsert(model, content, pluginsData) {
    let variables;
    if(model != "kh4q0ozorrgaq2mezktnrmdwleo1d") {
      // Generate variables to insert
      variables = {
        ...content,
        plugins_data: pluginsData
      }

    } else {
      // Inserting a model in our models_indexed table
      variables = {
        stream_id: content.stream_id,
				controller: content.controller,
        name: content.name ? content.name : content.title,
        mapped_name: content.mapped_name,
        content: content
      }
    }

    // Extracting field names and values from data
    const fields = Object.keys(variables);
    const values = Object.values(variables);

    // Define which fields to update in case of conflict
    const updateFields = fields.filter(field => field !== 'stream_id');

    // Retrieving table name from mapping
    let tableName = model;

    // Building the query
    const queryText = `
    INSERT INTO ${tableName} (${fields.join(', ')})
    VALUES (${fields.map((_, index) => `$${index + 1}`).join(', ')})
    ON CONFLICT (stream_id)
    DO UPDATE SET ${updateFields.map(field => `${field} = EXCLUDED.${field}`).join(', ')}
    RETURNING *;`;

    /** If stream is a model we trigger the indexing */
    if(model == "kh4q0ozorrgaq2mezktnrmdwleo1d") {
      //this.indexModel(content.stream_id);
    }

    /** Try to insert stream in the corresponding table */
    try {
      const res = await this.adminPool.query(queryText, values);
      console.log(cliColors.text.green,  `✅ Upserted stream `, cliColors.reset, variables.stream_id, cliColors.text.cyan, " in ", cliColors.reset, tableName);
      return true;
    } catch (e) {
      if (e.code === '42P01') {
        // Trigger indexing of new model with a callback to retry indexing this stream
        this.indexModel(model, () => this.upsert(model, content, pluginsData));
      } else {
        console.error(cliColors.text.red, `Error inserting stream ${variables.stream_id}:`, cliColors.reset, e.message);
      }
      return false;
    }
  }

  /** Will prepare the indexing of a model by creating the corresponding table in our database */
  async indexModel(model, callback) {
    let content;
    let title;
    let uniqueFormattedTitle;
    let fields;

    if(model != "kh4q0ozorrgaq2mezktnrmdwleo1d") {
      // Step 1: Load model details if not genesis stream
      let stream = await global.indexingService.ceramic.client.loadStream(model);
      content = stream.content;
      if(content?.schema?.properties) {

        let postgresFields = this.jsonSchemaToPostgresFields(content.schema.properties);
        title = content.name ? content.name : content.title;

        // Generate a unique table name
        uniqueFormattedTitle = await this.generateUniqueTableName(title);

        // Step 2: Convert model variables in SQL columns
        fields = [
          { name: 'stream_id', type: 'TEXT PRIMARY KEY' }, // Added automatically
          { name: 'controller', type: 'TEXT' }, // Added automatically
          ...postgresFields,
          { name: '_metadata_context', type: 'TEXT' }, // Added automatically
          { name: 'plugins_data', type: 'JSONB' }, // Added automatically
          { name: 'indexed_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' } // Added automatically
        ];
      } else {
        console.log("This stream is either not valid or not a supported model:", content);
      }
    } else {
      title = "models_indexed";
      uniqueFormattedTitle = "models_indexed";
      fields = [
        { name: 'stream_id', type: 'TEXT PRIMARY KEY' }, // Added automatically
        { name: 'controller', type: 'TEXT' }, // Added automatically
        { name: 'name', type: 'TEXT' },
        { name: 'mapped_name', type: 'TEXT' },
        { name: 'content', type: 'JSONB' },
        { name: 'indexed_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' } // Added automatically
      ];
    }

    // Step 3: Build SQL query and run
    await this.createTable(model, fields, uniqueFormattedTitle, callback);
    
    // Step 4: Insert new row in models_indexed table
    if(model != "kh4q0ozorrgaq2mezktnrmdwleo1d") {
      this.upsert('kh4q0ozorrgaq2mezktnrmdwleo1d', {
        stream_id: model,
        controller: content.controller,
        name: title,
        mapped_name: uniqueFormattedTitle,
        content: content
      }, null);
    }
   
  }

  /** 
   * Will create a new table dynamically based on the model id and fields 
   */
  async createTable(model, fields, uniqueFormattedTitle, callback) {
    // Construct the columns part of the SQL statement
    const columns = fields.map(field => `"${field.name}" ${field.type}`).join(', ');

    // Construct the full SQL statement for table creation
    const createTableQuery = `CREATE TABLE IF NOT EXISTS "${model}" (${columns});
      
      CREATE INDEX IF NOT EXISTS "${model}_stream_id_idx" ON "${model}" ("stream_id");
      CREATE INDEX IF NOT EXISTS "${model}_controller_idx" ON "${model}" ("controller");
      CREATE INDEX IF NOT EXISTS "${model}_indexed_at_idx" ON "${model}" ("indexed_at");`;

    try {
      // Execute the table creation query
      await this.adminPool.query(createTableQuery);

      // Keep track of new table name
      this.mapTableName(model, uniqueFormattedTitle);

      console.log(cliColors.text.cyan, `🧩 Created table:`, cliColors.reset, uniqueFormattedTitle);

      // Will trigger a callback if provided by the parent function
      if (callback) {
        callback();
      }
    } catch (err) {
      console.error(cliColors.text.red, "Error creating new table.", cliColors.reset, err.stack);
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
    let settings = getOrbisDBSettings();

    try {
      const modelsMapping = settings.models_mapping;
      // Check if tableName exists as a value in models_mapping
      if (modelsMapping && Object.values(modelsMapping).includes(tableName)) {
          return true; // Table exists in models_mapping
      }
      return false; // Table not found in models_mapping
    } catch (e) {
        console.log(cliColors.text.red, "❌ Error checking table existence:", cliColors.reset, e);
        return false;
    }
  }

  /** Will make sure we keep track of the relationship between the model id and readable table name */
  async mapTableName(model, title) {
    // Retrieve current settings
    let settings = getOrbisDBSettings();

     // Check if models_mapping exists, if not, create it
    if (!settings.models_mapping) {
      settings.models_mapping = {};
    }

    // Assign new configuration values
    settings.models_mapping[model] = title;

    // Rewrite the settings file
    updateOrbisDBSettings(settings)
  }

  /** Will run any query and return the results */
  async query(userQuery, params) {
    const defaultLimit = 100;
    let modifiedQuery = await this.replaceTableNames(userQuery);

    // Check if the query already contains a LIMIT clause
    /*if (!/LIMIT \d+/i.test(userQuery)) {
      modifiedQuery += ` LIMIT ${defaultLimit}`;
    }*/

    try {
      const client = await this.readOnlyPool.connect();
      const res = await client.query(modifiedQuery, params);
      client.release();
      return { data: res };
    } catch (e) {
      console.error(cliColors.text.red, `❌ Error executing query:`, cliColors.reset, e.message);
      return false;
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
        if(!replacementValue) {
          replacementValue = originalTableName;
        }
        console.log("Switching " + originalTableName + " with " + replacementValue);
        const regex = new RegExp(`\\b${originalTableName}\\b`, 'g');
        resultSql = resultSql.replace(regex, replacementValue);
    }

    return resultSql;
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
      WHERE relname = '${table}';`;

    try {
      const client = await this.readOnlyPool.connect();
      const res = await client.query(queryText);
      const countResult = await client.query(countQuery);
      const commentResult = await client.query(commentQuery);
      client.release();

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

      postgresFields.push({ name: key.toLowerCase(), type: postgresType });
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
