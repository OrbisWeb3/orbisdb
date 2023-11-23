import { CeramicClient } from '@ceramicnetwork/http-client';
import { ModelInstanceDocument } from "@ceramicnetwork/stream-model-instance";
import { StreamID } from "@ceramicnetwork/streamid";
import { Model } from '@ceramicnetwork/stream-model';

/** To generate dids from a Seed */
import { DID } from 'dids'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import { getResolver } from 'key-did-resolver'

export default class CSVUploaderPlugin {
  constructor({ ceramic_seed }) {
    this.model_id = "kjzl6hvfrbw6c8pzfstttcl1xessjf6wc87k3t2pyz3ibsypfxxjrneh9ioamyb";
    this.ceramic_seed = JSON.parse(ceramic_seed);

    // Initialize the Orbis class object
    this.ceramic = new CeramicClient("https://node2.orbis.club/");
    this.session;

    // Initialize connection to Ceramic
    this.connect();
  }

  /**
   * This will initialize all of the hooks used by this plugin.
   * A plugin can register multiple hooks, each hook being linked to a function that will be executed when the hook is triggered
   */
  async init() {
    return {
      ROUTES: {
        GET: {
          "upload": (req, res) => this.uploadRoute(req, res)
        },
        POST: {
          "parse": (req, res) => this.parseRoute(req, res)
        }
      },
    };
  }

  /** Will connect to Ceramic using the seed passed by the plugin settings and trigger the fetch interval */
  async connect() {
    try {
      let seed = new Uint8Array(this.ceramic_seed);

      /** Create the provider and resolve it */
  		const provider = new Ed25519Provider(seed);
  		let did = new DID({ provider, resolver: getResolver() })

  		/** Authenticate the Did */
  		await did.authenticate()

  		/** Assign did to Ceramic object  */
  		this.ceramic.did = did;
  		this.session = {
  			did,
  			id: did.id
  		};

      /*
      let model_stream = await Model.create(this.ceramic,
        modelDef,
        {
          model: "kh4q0ozorrgaq2mezktnrmdwleo1d",
          controller: this.session.id
        }
      );
      console.log("model_stream:", model_stream?.id?.toString())*/

      console.log("Connected to Ceramic with DID:", did.id);
    } catch(e) {
      console.log("Couldn't connect to Ceramic, check the seed again:", e);
    }
  }

  /** Example of an API route returning a simple HTML page. The routes declared by a plugin are automatically exposed by the OrbisDB instance */
  uploadRoute(req, res) {
    const { plugin_id, context_id } = req.params;
    console.log("context_id is:", context_id);
    res.send(`<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>CSV Upload and Parse</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js"></script>
      </head>
      <body>
          <h2>Upload CSV File</h2>
          <input type="file" id="csvFileInput" accept=".csv" />
          <button onclick="handleUpload()">Upload and Parse</button>
          <pre id="output"></pre>

          <script>
            function handleUpload() {
              const input = document.getElementById('csvFileInput');
              const file = input.files[0];

              Papa.parse(file, {
                complete: function(results) {
                  console.log('Parsed CSV data:', results.data);
                  document.getElementById('output').textContent = JSON.stringify(results.data, null, 2);

                  // Send data to the server
                  sendDataToServer(results.data);
                },
                header: true // Set to true if your CSV has headers, false otherwise
              });
            }

            function sendDataToServer(data) {
              console.log("Enter sendDataToServer with data:", data);
                fetch('./parse', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    data: data
                  })
                })
                .then(response => response.json())
                .then(data => console.log(data))
                .catch(error => console.error('Error:', error));
            }
        </script>
      </body>
      </html>`);
  }

  async parseRoute(req, res) {
    console.log("req.params:", req.params);
    if(req.body) {
      const { plugin_id, context_id } = req.params;
      const { data } = req.body;
      console.log('Received CSV Data:', data);
      let i = 0;

      // Loop through all rows and
      for (const content of data) {
        // Optionally, you can check if the content is not empty
        if (Object.keys(content).length > 0) {
          try {
            let _content = {
              ...content,
              context: context_id
            };

            /** We call the update hook here in order to support hooks able to update data before it's created in Ceramic  */
				    let __content = await global.indexingService.hookHandler.executeHook("update", _content, context_id);
            console.log("__content:", __content);

            /** We then create the stream in Ceramic with the updated content */
            let stream = await ModelInstanceDocument.create(
              this.ceramic,
              __content,
              {
                model: StreamID.fromString(this.model_id),
                controller: this.session.id
              }
            );
            let stream_id = stream.id?.toString();

            // Force index stream in db if created on Ceramic
            if(stream_id) {
              console.log("stream created:", stream_id);
              global.indexingService.indexStream({ streamId: stream_id, model: this.model_id });
            }
            i++;
          } catch (error) {
            console.error('Error creating stream:', error);
          }
        }
      }

      res.send({ message: 'CSV data uploaded to Ceramic successfully.', count: i });
    }
  }
}


let modelDef = {
  "name": "OpenBookData",
  "description": "Model storing books data.",
  "version": "1.0",
  "accountRelation": {
    "type": "list"
  },
  "schema": {
    "type": "object",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "required": [
      "Title",
      "Author"
    ],
    "properties": {
      "Title": {
        "type": "string"
      },
      "Description": {
        "type": ["string", "null"]
      },
      "Author": {
        "type": "string"
      },
      "context": {
        "type": "string"
      }
    },
    "additionalProperties": false
  }
}
