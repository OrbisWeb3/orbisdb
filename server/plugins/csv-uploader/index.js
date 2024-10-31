import logger from "../../logger/index.js";
import { sleep } from "../../utils/helpers.js";
import { v4 as uuidv4 } from "uuid";

export default class CSVUploaderPlugin {
  logs = [];
  progress = 0;
  status = 0

  constructor() {
    this.progressStore = {};
    logger.debug("Enter init(à for CSVUploaderPlugin and uuid:" + this.uuid);
    this.progressStoreTestInterval();
  }

  /**
   * This will initialize all of the hooks used by this plugin.
   * A plugin can register multiple hooks, each hook being linked to a function that will be executed when the hook is triggered
   */
  async init() {
    /** Return routes and hooks used by plugin */
    return {
      ROUTES: {
        GET: {
          upload: (req, res) => this.uploadRoutev2(req, res),
          progress: (req, res) => this.progressRoute(req, res),
        },
        POST: {
          parse: (req, res) => this.parseRoute(req, res),
        },
      }
    };
  }

  async progressStoreTestInterval() {
    // Start the interval function
    this.interval = setInterval(() => {
      // TODO: See why this debug was important - remove due to clutter
      // logger.debug(
      //   "In progressStoreTestInterval for id " + this.uuid + ":",
      //   this.progressStore
      // );
    }, 1 * 3000);
  }

  // Will expose dynamic variables that can be exposed on the front end
  async getDynamicVariables() {
    let results = [];

    // Set color for badges
    let badgeReady = "flex bg-sky-50 text-sky-900 rounded-full px-3 py-1 text-xs font-medium border border-sky-200";
    let badgeProcessing = "flex bg-orange-50 text-orange-900 rounded-full px-3 py-1 text-xs font-medium border border-orange-200"

    // Push logs
    results.push({
      name: "Status",
      value: this.status == 0 ? "Ready" : "Processing",
      className: this.status == 0 ? badgeReady : badgeProcessing,
      type: "badge"
    });

    // Push progress of upload started
    if(this.progress > 0) {
      results.push({
        name: "Upload Progress",
        type: "slider",
        progress: this.progress ? this.progress : 0,
        value: this.progress
      })
    }

    // Push logs
    if(this.logs && this.logs.length > 0) {
      results.push({
        name: "Logs",
        value: this.logs,
        type: "logs"
      });
    }


    // Return dynamic variables as an array
    return {
      results: results
    };
  }

  // Will handle logs for this plugin
  addLog(newLog) {
    // Add the new log to the array
    this.logs.push(newLog);
    
    // If the array length exceeds 50, remove the oldest logs
    if (this.logs.length > 50) {
      this.logs.splice(0, this.logs.length - 50);
    }
  }

  /** Example of an API route returning a simple HTML page. The routes declared by a plugin are automatically exposed by the OrbisDB instance */
  async uploadRoutev2(req, res) {
    const sessionId = uuidv4(); // Assign a unique identifier to this session (used for upload progress tracking)
    const authHeader = req.headers["authorization"];
    logger.debug("authHeader:", authHeader);

    // Generate HTML code to handle situation when plugin is already processing another file
    let uploadHtmlCode = ``;
    if(this.status == 0) {
      uploadHtmlCode = `<div id="fileUploadContainer" class="w-full flex justify-center mt-2">
              <input class="" type="file" id="csvFileInput" accept=".csv" onchange="handleFileSelect()" />
            </div>`
    } else {
      uploadHtmlCode = `<h4 class="text-base font-bold mt-2">This plugin is already processing another CSV. Please wait for completion before uploading a new one.</h4>  `;
    }

    res.type("text/html");
    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>CSV Upload and Parse</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js"></script>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          body {
            background: #f1f5f9;
          }
    
          .bg-main {
            background: #4483FD;
          }
    
          .bg-main:hover {
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
          
          .border-dashed-slate-300 {
            border: 1px dashed #cbd5e1;
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
    
          /* Progress Bar Styles */
          #progressBar {
            width: 0%;
            height: 18px;
            background-color: #4483FD;
            text-align: center;
            line-height: 18px;
            color: white;
            transition: width 0.4s ease;
          }
    
          #progressContainer {
            width: 100%;
            background: #E4E7E7
          }
        </style>
      </head>
    
      <body class="p-8 flex justify-center items-center">
        <div class="flex flex-col w-full md:w-2/3  text-sm justify-center items-center flex flex-col bg-white rounded-md shadow-sm border border-slate-200 px-8 py-4">
          <h2 class="text-xl font-bold">Upload your CSV Files to OrbisDB</h2>  
          <p class="mt-2 text-slate-600 mb-4 text-center">
            Context: <a target="_blank" href="https://cerscan.com/mainnet/stream/${this.context}" class="text-blue-600 hover:underline">${this.context}</a><br />
          </p>
          
          <div class="upload-container py-5 px-4 border-2 border-dashed w-full rounded-md mb-6 justify-center">
            <p class="text-center font-medium">Pick a CSV file from your computer</p>
            <p class="text-center text-slate-500">The column names in your CSV need to be an exact match of your model fields..</p>
            
            <!-- Input fields for file upload or message for already processing -->
            ${uploadHtmlCode}
            
            <div id="fieldsMappingContainer" class="hidden items-center flex flex-col">
              <!-- Let user change model name -->
              <div id="columnNamesContainer" class="mt-4 flex flex-col w-full px-4 py-2">
                <p class="text-base text-center font-medium text-gray-900 mb-2">MODEL NAME:</p>
                <input
                  type="text"
                  id="modelNameInput"
                  placeholder="Your model name"
                  class="flex-1 bg-white border border-slate-200 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900 mr-2" />
              </div>

              <!-- Display CSV column names -->
              <div class="flex w-full space-x-2 px-4 py-2">
                <div id="columnNamesContainer" class="mt-4 flex flex-col w-full">
                  <p class="text-base text-center font-medium text-gray-900 mb-2">FIELDS:</p>
                  <div id="columnNamesRow" class="flex flex-col space-y-1 items-center">
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Display upload button container -->
            <div id="upload-btn-container" class="hidden items-center flex flex-col mt-3">
              <button class="btn bg-blue-500 px-3 py-1.5 rounded pointer text-white" onClick="sendDataToServer()">Start upload</button>
            </div>

            <!-- Display processing indicator -->
            <div id="processing-btn-container" class="hidden items-center flex flex-col mt-3">
              <div class="btn bg-white border-dashed-slate-300 px-3 py-1.5 rounded text-slate-900">Processing</button>
            </div>
          </div>
          <div id="output" class="mb-2 mt-1 mt-1.5 text-center"></div>
        </div>
        <script>
          let dataToUpload = [];
          let JsonSchemaProperties = {};
          let modelName = "";

          function handleFileSelect() {
            const fileInput = document.getElementById('csvFileInput');
            // If a file is selected, trigger upload automatically
            if (fileInput.files.length > 0) {
              handleUpload();
            }
          }
    
          function handleUpload() {
            const input = document.getElementById('csvFileInput');
            const file = input.files[0];
            console.log("file:", file);
            
            modelName = file.name;
            console.log("fileName:", modelName);

            Papa.parse(file, {
              complete: function(results) {
                console.log("results: ", results)
                console.log('Parsed CSV data:', results.data);
                console.log('Column names:', results.meta.fields);
                
                // Show upload btn
                document.getElementById('upload-btn-container').style.display = 'flex'; 

                // Get row elements
                document.getElementById('fieldsMappingContainer').classList.remove('hidden');
                const columnNamesRow = document.getElementById('columnNamesRow');
                // Set the default value of model name
                modelName = modelName.substring(0, modelName.lastIndexOf(".")) || modelName; // Remove extension
                document.getElementById("modelNameInput").value = modelName;
                document.getElementById("modelNameInput").addEventListener('change', (e) => {
                    console.log("New model name is: " + e.target.value);
                    modelName = e.target.value;
                  });

                // For each column name, create a div element and append it to the row
                results.meta.fields.forEach(fieldName => {
                  // Create a div container for each field
                  const fieldContainer = document.createElement('div');
                  fieldContainer.classList.add('px-4', 'py-2', 'border-2', 'border-transparent', 'text-left', 'text-base', 'font-medium', 'text-gray-500', 'rounded-md', 'bg-gray-50', 'flex', 'items-center', 'space-x-2');

                  // Add the field name as text
                  const fieldNameElement = document.createElement('span');
                  fieldNameElement.textContent = fieldName;
                  fieldContainer.appendChild(fieldNameElement);

                  // Create the select dropdown
                  const select = document.createElement('select');
                  select.classList.add('bg-white', 'border', 'border-slate-200', 'rounded-md', 'shadow-sm', 'px-3', 'py-1.5', 'text-sm', 'font-medium', 'text-slate-900');

                  // Add other options for field types
                  const options = ['string', 'number', 'boolean', 'object', 'array', 'did', 'datetime'];
                  options.forEach(type => {
                    const option = document.createElement('option');
                    option.value = type;
                    option.textContent = type.charAt(0).toUpperCase() + type.slice(1); // Capitalize first letter
                    if (type === 'string') {
                      option.selected = true; // Set "string" as the default selected option
                    }
                    select.appendChild(option);
                  });

                  // Initialize field with default type in the schema properties
                  JsonSchemaProperties[fieldName] = { type: "string" };

                  // Event handler for selection changes (optional: customize as needed)
                  select.addEventListener('change', (e) => {
                    console.log("Field " + fieldName + " update to " + e.target.value);
                    // Update the schema with the selected type for this field
                    JsonSchemaProperties[fieldName] = { type: e.target.value };
                  });

                  // Append the select dropdown to the field container
                  fieldContainer.appendChild(select);

                  // Append the field container to the row element
                  columnNamesRow.appendChild(fieldContainer);
                });

                // Send data to the server
                dataToUpload = results;
              },
              header: true // Set to true if your CSV has headers, false otherwise
            });
          }
    
          function sendDataToServer() {
            let data = dataToUpload;
            console.log("Enter sendDataToServer with data:", dataToUpload);
            let countRows = dataToUpload?.data?.length;
            document.getElementById('output').textContent = "Go back to the plugin page to view progress.";
            //document.getElementById('submit').style.display = 'none'; 
            document.getElementById('upload-btn-container').style.display = 'none';
            document.getElementById('processing-btn-container').style.display = 'flex';
            startProgressUpdates();
            fetch('./parse', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  data: data.data,
                  properties: JsonSchemaProperties,
                  modelName: modelName,
                  sessionId: "${sessionId}"
                })
              })
              .then(response => response.json())
              .then(data => {
                console.log("data from ./parse:", data);
              })
              .catch(error => {
                console.error('Error:', error);
              });
          }
    
          function startProgressUpdates() {
            console.log("Enter startProgressUpdates");
          }
        </script>
      </body>
    </html>`;
  }

  /** Will parse the data retrieved from CSV and push it to Ceramic one by one */
  async parseRoute(req, res) {
    this.status = 1;
    this.logs = [];
    if (!req.body) {
      return res.badRequest("No request body found.");
    }

    let stream_ids = [];

    const { data, sessionId, properties, modelName } = req.body;
    console.log("properties:", properties);

    // Log
    this.addLog({
      color: "sky",
      title: `Starting uploading CSV with ${data.length} rows.`
    });

    // Build schema
    let cleanModelName = modelName.replace(/[^a-zA-Z0-9]/g, '');
    let schema = {
      name: cleanModelName,
      version: "1.0",
      accountRelation: {
        type: "list",
      },
      schema: {
        type: "object",
        $schema: "https://json-schema.org/draft/2020-12/schema",
        additionalProperties: false,
        properties: properties,
        required: []
      }
    };
    console.log("schema:", JSON.stringify(schema));

    // Create model
    let model;
    try {
      model = await this.orbisdb.ceramic.createModel(schema);
      console.log("model created:", model);
      this.addLog({
        color: "sky",
        title: `Model created for dataset: ${model.id}.`
      });
    } catch(e) {
      console.log("Error creating model:", e);
      this.addLog({
        color: "red",
        title: `Error creating model ${e.message}.`
      });
    }

    // If model created with success we proceed computing the streams
    if(model) {
      logger.debug("Received CSV Data:", data);

      // Reset progress and errors 
      let i = 0;
      let iErrors = 0;

      // Log start
      this.addLog({
        color: "sky",
        title: `Starting to process rows.`
      });

      // Loop through all rows and
      for (const content of data) {
        // Check if the content is not empty
        if (Object.keys(content).length > 0) {
          try {
            // Filter __content and convert numbers to their respective typed objects
            let filteredContent = Object.keys(content)
              .filter((key) => key in properties) // Filter keys based on properties
              .reduce((obj, key) => {
                const value = content[key];
                obj[key] = this.convertToTypedObject(key, value, properties); // Convert and assign the value
                logger.debug("obj[key]:", obj[key]);
                return obj;
              }, {});

            /** We then create the stream in Ceramic with the updated content */
            let stream = await this.orbisdb
              .insert(model.id)
              .value(filteredContent)
              .context(this.context)
              .run();

            let stream_id = stream.id?.toString();
            console.log("Created stream:", stream_id);
            stream_ids.push(stream_id);
            
            // Increment processed rows
            i++;

            // Calculate the progress as a percentage
            let _progress = ((i + iErrors) / data.length) * 100;
            this.progress = _progress.toFixed(2);

            await sleep(100);
          } catch (e) {
            logger.error("Error creating stream:", e);
            iErrors++;

            this.addLog({
              color: "red",
              title: `Error creating stream: ${e.message}.`
            });
            this.progressStore[sessionId] = {
              totalRows: data.length,
              processedRows: i,
              failedRows: iErrors,
            };
          }
        }
      }

      this.addLog({
        color: "green",
        title: `Uploaded ${i} rows from CSV file with ${iErrors} errors.`
      });

      // Reset status
      this.status = 0;

      return {
        message: "CSV data uploaded to Ceramic successfully",
        count: i,
        streams: stream_ids,
      };
    } else {
      this.addLog({
        color: "red",
        title: `Error creating model.`
      });

      // Reset status
      this.status = 0;

      return {
        message: "Error uploading CSV",
        streams: []
      };
    }
  }

  // Function to determine if a number should be treated as 'int' or 'float' based on properties
  convertToTypedObject(key, value, properties) {
    const type = properties[key]?.type;

    if(type) {
      if (type.includes("integer")) {
        return parseInt(value, 10);
      }
  
      if (type.includes("float") || type.includes("numeric") || type.includes("number")) {
        return parseFloat(value, 10);
      }
  
      if (type.includes("array") || type.includes("object")) {
        return JSON.parse(value);
      }
    }

    return value;
  }

  // Function to handle progress requests
  async progressRoute(req, res) {
    const sessionId = req.params.plugin_params; // Adjusted for GET request
    const progress = this.progressStore[sessionId] || null;

    if (!progress) {
      return res.notFound(`Session ${sessionId} not found.`);
    }

    return progress;
  }
}
