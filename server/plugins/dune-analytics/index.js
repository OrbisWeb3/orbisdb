import { DuneClient, ColumnType, ContentType } from "@duneanalytics/client-sdk";
import logger from "../../logger/index.js";
import { Parser } from "json2csv";
import cron from "node-cron";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const timestampFilePath = path.join(__dirname, "timestamp.json");

export default class DuneAnalyticsPlugin {
  /**
   * This will initialize all of the hooks used by this plugin.
   * A plugin can register multiple hooks, each hook being linked to a function that will be executed when the hook is triggered
   */
  async init() {
    console.log("In Dune :", this.uuid);
    this.headers = {
      "X-DUNE-API-KEY": this.dune_api_key,
      "Content-Type": "text/csv",
    };

    this.client = new DuneClient(this.dune_api_key);

    // Create Dune Table for this model (it won't create duplicate if already exists)
    this.createTable();
    //this.process();

    return {
      ROUTES: {
        GET: {
          force_refresh: this.uploadRoute,
          process: this.process,
        },
      },
      HOOKS: {
        generate: () => this.start(),
      },
    };
  }

  /** Will create cron job for the process task */
  start() {
    if (this.cron_interval) {
      this.task = cron.schedule(this.cron_interval, () => {
        this.process();
        console.log("Running the process task every:", this.cron_interval);
      });
    }
  }

  /** Will make sure cron job is stopped if OrbisDB is restarted */
  async stop() {
    logger.debug("Stopping plugin:", this.uuid);
    this.task.stop();
  }

  /** Will create the corresponding Dune table */
  async createTable() {
    // Will find the schema of the selected table
    const schema = await this.fetchTableSchema();

    // Will create the table on Dune (will fail if table name already exixts).
    try {
      const result = await this.client.table.create({
        namespace: this.namespace,
        table_name: this.model_id,
        is_private: this.is_private == "yes" ? true : false,
        schema: schema,
      });

      // Save table's name on Dune
      if (result) {
        this.dune_table_name = result.full_name;
      }
      console.log("result creating table:", result);
    } catch (e) {
      console.log("Error creating table on Dune:", e);
    }
  }

  /** Will fetch the table schema in order to  */
  async fetchTableSchema() {
    try {
      const result = await global.indexingService.databases[this.slot].query(
        `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
      `,
        [this.model_id]
      );

      this.schema = result?.data?.rows.map((row) => ({
        name: sanitizeColumnName(row.column_name),
        type: this.mapColumnType(row.data_type),
      }));

      return this.schema;
    } catch (e) {
      console.log("Error fething db schema:", e);
    }
  }

  // Define a function to map PostgreSQL data types to Dune's ColumnType
  mapColumnType(dataType) {
    switch (dataType) {
      case "integer":
      case "bigint":
      case "smallint":
        return ColumnType.Integer;
      case "decimal":
      case "numeric":
      case "real":
      case "double precision":
        return ColumnType.Double;
      case "timestamp without time zone":
      case "timestamp with time zone":
      case "date":
        return ColumnType.Timestamp;
      case "boolean":
        return ColumnType.Boolean;
      case "character varying":
      case "text":
        return ColumnType.Varchar;
      default:
        return ColumnType.Varchar; // default to varchar for other types
    }
  }

  /** Will process the just created stream and push it to Dune */
  async process(req, res) {
    console.log("In Dune Analytics process.");

    // Read the current timestamps
    let timestamps = {};
    let latestExecTimestamp = new Date(0).toISOString(); // Default to epoch time
    try {
      if (fs.existsSync(timestampFilePath)) {
        const dataTimestamp = fs.readFileSync(timestampFilePath, "utf8");
        timestamps = JSON.parse(dataTimestamp);
        console.log("timestamps:", timestamps);
        if (timestamps && timestamps[this.uuid]) {
          latestExecTimestamp = timestamps[this.uuid];
        }
      }
    } catch (err) {
      console.error("Error reading timestamp file:", err);
    }

    // Find streams that should be processed by Dune
    let results;
    try {
      results = await global.indexingService.databases[this.slot].query(
        `
        SELECT *
        FROM ${this.model_id}
        WHERE indexed_at > $1 AND _metadata_context = $2
      `,
        [latestExecTimestamp, this.context]
      );
    } catch (e) {
      console.log("Error loading results with orbisdb:", e);
      return;
    }

    // Process the upload only if the query returned results
    if (results?.data?.rows && results.data.rows.length > 0) {
      // Ensure the first row matches the schema structure
      const fittedRows = results.data.rows.map((row) =>
        this.fitStreamToSchema(row, this.schema)
      );

      // Convert the JSON object to CSV
      const parser = new Parser();
      const csv = parser.parse(fittedRows);

      // URL for the Dune API
      const url = `https://api.dune.com/api/v1/table/${this.namespace}/${this.model_id}/insert`;

      // Create the CSV file
      const filePath = path.join(__dirname, "data.csv");
      fs.writeFileSync(filePath, csv, "utf8");

      let responseData;
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: this.headers,
          body: csv,
        });

        responseData = await response.json();

        // Save timestamp in timestamp.json file
        if (response.ok) {
          // Update the timestamp for this UUID after successful processing
          timestamps[this.uuid] = new Date().toISOString();
          fs.writeFileSync(
            timestampFilePath,
            JSON.stringify(timestamps, null, 2),
            "utf8"
          );
        }
      } catch (err) {
        console.error("Error inserting stream in Dune:", err);
      } finally {
        // Clean up the file after uploading
        fs.unlinkSync(filePath);

        return {
          status: 200,
          result: `Success uploading ${responseData.rows_written} to the ${responseData.name} table.`,
        };
      }
    } else {
      console.log(
        `There wasn't any stream to upload to Dune (created after timestamp ${latestExecTimestamp}).`
      );
      return {
        status: 300,
        result: "Error uploading data to Dune.",
      };
    }
  }

  // Ensure the stream object matches the schema structure
  fitStreamToSchema(stream, schema) {
    const sanitizedStream = sanitizeObjectKeys(stream);
    const fittedStream = {};

    schema.forEach((field) => {
      fittedStream[field.name] = sanitizedStream.hasOwnProperty(field.name)
        ? sanitizedStream[field.name]
        : null;
    });

    return fittedStream;
  }

  /** Example of an API route returning a simple HTML page. The routes declared by a plugin are automatically exposed by the OrbisDB instance */
  async uploadRoute(req, res) {
    res.type("text/html");

    return `<!DOCTYPE html>
      <html>
        <head>
          <title>Upload your Data to Dune Analytics</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            body {
              background: #f1f5f9;
            }
      
            .button-main {
              background: #4483FD;
              color: #FFF;
              border-radius: 4px;
            }
      
            .button-main:hover {
              background: #1e58f2;
            }
      
            .bg-success {
              background: #22c55e;
            }
            .text-success {
              color: #22c55e;
            }
            
            .text-slate-500 {
              color: #6b7280;
            }
      
            .text-slate-600 {
              color: #475569;
            }
            
            .upload-container {
              border-color: #E4E7E7;
            }

            .highligted-green {
              border: 2px dashed #22c55e; /* Adjust color as needed */
              color: #22c55e;
            }
            .rejected-red {
              color: #dc2626;
            }
          </style>
        </head>
        <body class="p-8 flex justify-center items-center">
          <script>
            async function startDuneUpload() {
              document.getElementById('submit').style.display = 'none'; 
              document.getElementById('output').textContent = "Loading...";
              console.log("Enter startDuneUpload.");
              let response = await fetch('./process');
              let results = await response.json();
              console.log("results:", results);
              if(results.status == 200) {
                document.getElementById('output').textContent = "Success uploading data to Dune.";
                document.getElementById('success').style.display = 'flex'; 
              } else {
                document.getElementById('output').textContent = "Error uploading data to Dune.";
              }
            }
          </script>
          <div class="flex flex-col w-full md:w-2/3  text-sm justify-center items-center flex flex-col bg-white rounded-md shadow-sm border border-slate-200 px-8 py-4">
            <h2 class="text-xl font-bold mb-2">Upload your data to Dune Analytics</h2> 
            <button id="submit" class="button-main px-2 py-1" onClick="startDuneUpload()">Upload</button>
            <div id="output" class="mb-2 mt-1.5"></div>
            <div id="success" class="hidden text-success text-sm font-medium flex-row items-center justify-center">Success!</button>
          </div>
        </body>
      </html>`;
  }
}

// Sanitize column names to fit Dune's expectations
function sanitizeColumnName(name) {
  return name
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^[^a-z]+/, "")
    .toLowerCase();
}

// Sanitize all keys in an object
function sanitizeObjectKeys(obj) {
  const sanitizedObject = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const sanitizedKey = sanitizeColumnName(key);
      sanitizedObject[sanitizedKey] = obj[key];
    }
  }
  return sanitizedObject;
}

/** Will convert the JSON object to the type requested by Dune */
function convertToNDJSON(data) {
  return data.map((row) => JSON.stringify(row)).join("\n");
}
