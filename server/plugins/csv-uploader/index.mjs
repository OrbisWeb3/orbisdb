import { sleep } from "../../utils/helpers.mjs";
import { v4 as uuidv4 } from 'uuid';

export default class CSVUploaderPlugin {
  constructor() {
    this.progressStore = {};
    console.log("Enter init(à for CSVUploaderPlugin and uuid:" + this.uuid);
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
          "upload": (req, res) => this.uploadRoute(req, res),
          "progress": (req, res) => this.progressRoute(req, res)
        },
        POST: {
          "parse": (req, res) => this.parseRoute(req, res)
        }
      },
    };
  }

  async progressStoreTestInterval() {
    // Start the interval function
    this.interval = setInterval(() => {
       console.log("In progressStoreTestInterval for id " + this.uuid + ":", this.progressStore)
    }, 1 * 3000);
  }

  /** Example of an API route returning a simple HTML page. The routes declared by a plugin are automatically exposed by the OrbisDB instance */
  async uploadRoute(req, res) {
    const sessionId = uuidv4(); // Assign a unique identifier to this session (used for upload progress tracking)
    this.progressStore[sessionId] = { totalRows: 0, processedRows: 0 };
    const authHeader = req.headers['authorization'];
    console.log("authHeader:", authHeader);

    let model_details = await this.orbisdb.ceramic.getModel(this.model_id);
    console.log("model_details:", model_details);
    let properties = model_details.schema.schema.properties;
    console.log("properties:", properties);

    // Serialize the properties object to a JSON string
    let propertiesJson = JSON.stringify(properties);
    
    res.send(`<!DOCTYPE html>
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
          <h2 class="text-xl font-bold">Upload your CSV Files to Ceramic</h2>  
          <p class="mt-2 text-slate-600 mb-4 text-center">
            Context: <a target="_blank" href="https://cerscan.com/mainnet/stream/${this.context}" class="text-blue-600 hover:underline">${this.context}</a><br />
            Model: <a target="_blank" href="https://cerscan.com/mainnet/stream/${this.model_id}" class="text-blue-600 hover:underline">${this.model_id}</a>
          </p>
          
          
          <div class="upload-container py-5 px-4 border-2 border-dashed w-full rounded-md mb-6 justify-center">
            <p class="text-center font-medium">Pick a CSV file from your computer</p>
            <p class="text-center text-slate-500">The column names in your CSV need to be an exact match of your model fields..</p>
            
            <!-- Input fields for file upload -->
            <div id="fileUploadContainer" class="w-full flex justify-center mt-2">
              <input class="" type="file" id="csvFileInput" accept=".csv" onchange="handleFileSelect()" />
            </div>
            
            <!-- Map CSV column names to model fields name -->
            <div id="fieldsMappingContainer" class="hidden items-center flex flex-col">
              <div class="flex flex-row space-x-2 w-2/3 mt-4 mb-3">
             
                <!-- Display column names -->
                <div id="columnNamesContainer" class="mt-4 flex w-1/2 flex-col">
                  <p class="text-xs text-center font-medium text-gray-900 mb-2">CSV FIELDS:</p>
                  <div id="columnNamesRow" class="flex flex-col space-y-1">
                  </div>
                </div>
              
                <!-- Display model fields -->
                <div id="modelFieldsContainer" class="mt-4 flex w-1/2 flex-col">
                  <p class="text-xs text-center font-medium text-gray-900 mb-2">MODEL FIELDS:</p>
                  <div id="modelFieldsRow" class="flex flex-col space-y-1">
                    <!-- Model fields will be appended here -->
                  </div>
                </div>
              </div>

              <button class="btn bg-blue-500 px-3 py-1.5 rounded pointer text-white" onClick="sendDataToServer()"}>Start upload</button>
            </div>
          </div>

          <div id="progressContainer" class="w-full rounded-full overflow-hidden items-center">
            <div id="progressBar" class="bg-blue-600 text-xs font-medium text-blue-100 text-center px-2 leading-none rounded-full items-center">0%</div>
          </div>
          <div id="output" class="mb-2 mt-1.5"></div>
          <div id="success" class="hidden text-success text-sm font-medium flex-row items-center justify-center">Success!</button>
        </div>
        <script>
          let dataToUpload;
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
            Papa.parse(file, {
              complete: function(results) {
                console.log("results: ", results)
                console.log('Parsed CSV data:', results.data);
                console.log('Column names:', results.meta.fields);
                console.log('Model field names:', ${propertiesJson}); 

                let modelFieldNames = Object.keys(${propertiesJson});

                // Get the table and make it visible
                document.getElementById('fileUploadContainer').classList.add("hidden");
                const fieldsMappingContainer = document.getElementById('fieldsMappingContainer');
                fieldsMappingContainer.classList.remove('hidden');

                // Get the container for model fields
                const modelFieldsRow = document.getElementById('modelFieldsRow');

                // Clear previous model fields
                modelFieldsRow.innerHTML = '';

                // Loop through properties object and append each field name
                modelFieldNames.forEach(fieldName => {
                  const el = document.createElement('div');
                  el.textContent = fieldName;
                  el.classList.add('px-4', 'py-2', 'border-2', 'border-transparent', 'text-left', 'text-xs', 'font-medium', 'text-gray-500', 'rounded-md', 'bg-gray-50');
                  
                  // Check if fieldName is also in CSV fields and add green border if so
                  if (results.meta.fields.includes(fieldName)) {
                    el.classList.add('highligted-green');
                  }
                  
                  modelFieldsRow.appendChild(el);
                });
                
                // Get row elements
                const columnNamesRow = document.getElementById('columnNamesRow');

                // For each column name, create a div element and append it to the row
                results.meta.fields.forEach(fieldName => {
                  const el = document.createElement('div');
                  el.textContent = fieldName;
                  el.classList.add('px-4', 'py-2', 'border-2', 'border-transparent', 'text-left', 'text-xs', 'font-medium', 'text-gray-500', 'rounded-md', 'bg-gray-50');
                  
                  // Check if fieldName is also in model fields and add green border if so
                  if (modelFieldNames.includes(fieldName)) {
                    el.classList.add('highligted-green');
                  } else {
                    el.classList.add('rejected-red');
                  }
                  
                  columnNamesRow.appendChild(el);
                });

                // Send data to the server
                dataToUpload = results.data;
                //sendDataToServer(results.data);
              },
              header: true // Set to true if your CSV has headers, false otherwise
            });
          }
    
          function sendDataToServer() {
            let data = dataToUpload;
            console.log("Enter sendDataToServer with data:", data);
            let countRows = data.length;
            document.getElementById('output').textContent = "Uploading " + countRows + " rows...";
            //document.getElementById('submit').style.display = 'none'; 
            startProgressUpdates();
            fetch('./parse', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  data: data,
                  sessionId: "${sessionId}",
                  modelProperties: ${propertiesJson}
                })
              })
              .then(response => response.json())
              .then(data => {
                console.log(data);
              })
              .catch(error => {
                console.error('Error:', error);
              });
          }
    
          function startProgressUpdates() {
            console.log("Enter startProgressUpdates");
            
            // Initialize a variable to track if any rows have been processed
            let hasProcessedAnyRows = false;
          
            const progressInterval = setInterval(() => {
              console.log("Enter interval fetching in startProgressUpdates");
              fetch("./progress/${sessionId}")
                .then(response => response.json())
                .then(progress => {
                  console.log('Progress:', progress);
                  // Update progress bar based on 'progress'
                  let progressPercentage = ((progress.processedRows + progress.failedRows) / progress.totalRows * 100).toFixed(2);
          
                  document.getElementById('progressBar').style.width = progressPercentage + '%';
                  document.getElementById('progressBar').textContent = progressPercentage + '%';
                  console.log("progressPercentage:", progressPercentage);
                  
                  if ((progress.processedRows === progress.totalRows) && progress.totalRows > 0) {
                    clearInterval(progressInterval); // Stop polling on complete
                    document.getElementById('output').textContent = "Uploaded " + progress.processedRows + " rows with success. Failed " + progress.failedRows + " rows.";
                    document.getElementById('progressBar').style.backgroundColor = '#22c55e';
                  } else {
                    document.getElementById('output').textContent = "Processing " + (progress.processedRows + progress.failedRows) + "/"+progress.totalRows+" rows. Failed " + progress.failedRows + " rows.";
                  }
          
                  // Check if any rows have been processed or failed and update the flag
                  if (progress.processedRows > 0 || progress.failedRows > 0) {
                    hasProcessedAnyRows = true;
                  }
                })
                .catch(error => {
                  console.error('Error fetching progress:', error);
                  clearInterval(progressInterval); // Stopping polling on error
                });
            }, 1000); // Poll every second
          
            // Set a timeout to stop the interval after 10 minutes if no rows have been processed
            const stopIntervalTimeout = setTimeout(() => {
              if (!hasProcessedAnyRows) {
                console.log("No rows processed after 10 minutes. Stopping progress updates.");
                clearInterval(progressInterval);
              }
            }, 600000); // 600,000 milliseconds = 10 minutes
          
            // Ensure to clear the timeout if the process starts processing rows
            if (hasProcessedAnyRows) {
              clearTimeout(stopIntervalTimeout);
            }
          }
        </script>
      </body>
    </html>`);
  }
  
  /** Will parse the data retrieved from CSV and push it to Ceramic one by one */
  async parseRoute(req, res) {
    let stream_ids = [];
    if(req.body) {
      const { data, sessionId, modelProperties } = req.body;
      console.log("modelProperties:", modelProperties);

      // Update progressStore
      this.progressStore[sessionId] = { totalRows: data.length, processedRows: 0, failedRows: 0 };
      console.log('Received CSV Data:', data);
      let i = 0;
      let iErrors = 0;

      // Loop through all rows and
      for (const content of data) {
        // Optionally, you can check if the content is not empty
        if (Object.keys(content).length > 0) {
          try {
            /** We call the update hook here in order to support hooks able to update data before it's created in Ceramic  */
				    let __content = await global.indexingService.hookHandler.executeHook("update", content, this.context);

            /** Will filter all items with a key not in the model properties */
            let filteredContent = Object.keys(__content)
              .filter(key => key in modelProperties)
              .reduce((obj, key) => {
                obj[key] = __content[key];
                return obj;
              }, {});
            console.log("filteredContent:", filteredContent);

            /** We then create the stream in Ceramic with the updated content */
            let stream = await this.orbisdb.insert(this.model_id).value(filteredContent).context(this.context).run();
            let stream_id = stream.id?.toString();
            console.log("Inserted stream:", stream_id);
            stream_ids.push(stream_id);
            i++;
            /** Update progress store for this session id in order to be displayed in the app */
            this.progressStore[sessionId] = { totalRows: data.length, processedRows: i, failedRows: iErrors };
            console.log("this.progressStore:", this.progressStore);
            await sleep(100);
            
          } catch (error) {
            iErrors++;
            this.progressStore[sessionId] = { totalRows: data.length, processedRows: i, failedRows: iErrors };
            console.error('Error creating stream:', error);
          }
        }
      }

      res.send({ message: 'CSV data uploaded to Ceramic successfully.', count: i, streams: stream_ids });
    }
  }

  // Function to handle progress requests
  async progressRoute(req, res) {
    const sessionId = req.params.plugin_params; // Adjusted for GET request
    const progress = this.progressStore[sessionId] || null;
    if (progress) {
      res.json(progress);
    } else {
      res.json({ message: 'Session not found.', sessionId: sessionId, progressStore: this.progressStore });
    }
  }
}