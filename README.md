# OrbisDB
Driven by developer feedback and a new role as core developers in the Ceramic ecosystem, [Orbis](https://useorbis.com) is expanding its focus beyond social to offer a simple and efficient gateway for storing and managing open data on Ceramic.

> [!WARNING]  
> OrbisDB is a work-in-progress and is being developed in parallel with the OrbisDB SDK. It should be used only for test purposes for now.

OrbisDB is providing a developer-friendly interface to explore data with the ease of SQL and a plugin store to save development time on crypto-specific features; from data migration and gating mechanisms to automated blockchain interactions.

OrbisDB is based on the upcoming Firehose API developed by Ceramic which means that **your Ceramic node must be running at least** on `v5.0.1`. 

    npm i -g @ceramicnetwork/cli@^5.0.1

> [!WARNING]  
> The Ceramic Firehose API is still in beta so we recommend using it only on testing nodes for now.

## Component Overview
OrbisDB is divided in two main components - **core** and **plugins**.

This allows us to focus on stability and performance of core functions, while expanding functionality via the plugin system.

- **Core:**
    - Dedicated to read/write operation of the indexing service
    - Listens to stream changes of specific models being used by developers and indexes the content in a Postgres database.
- **Plugins:**
    - Optional and designed to perform operations beyond the core’s scope.
    - Divided **into 4 categories** (`Create streams`, `Add metadata`, `Validate` and `Post process`). More details about plugins underneath.

## Usage
To get started with OrbisDB we recommend downloading this repository locally and running it as a simple NodeJS program.

    npm install


    npm run dev

Your OrbisDB instance will then be running on port `7008`, allowing you to access it through your browser by navigating to `http://localhost:7008/`. If this is your first time using it, you will be prompted to enter the details of your Ceramic node as well as your database credentials, which are necessary for indexing.

## Architecture Overview

OrbisDB is built on top of Ceramic protocol and PostgreSQL (both of which are a requirement in order to run OrbisDB).

### Ceramic

Ceramic is used for stream discovery, modeling, network communications and writes.
We moved away from Tile Documents (used by Orbis Social) and are using Model Instance Documents used by ComposeDB, offering interoperability.

For model definition, we use standard Ceramic models, employing a JSON schema (unlike ComposeDB’s GraphQL approach). 

### PostgreSQL

We chose PostgreSQL as our indexing database due to its extensability, maturity and open-source values.
Postgres is used to index and query data from Ceramic, offering scalable performance and the benefits of traditional scaling methods.

### OrbisDB

OrbisDB is the MIT-licensed brains of the operation.
An OrbisDB node is responsible for Ceramic <> Postgres interactions, as well as exposing a REST API and a NextJS-powered UI to manage the node and data stored on it.

### OrbisDB SDK (@useorbis/db-sdk)

[OrbisDB SDK](https://github.com/OrbisWeb3/db-sdk) exposes a familiar user authentication interface, combined with an ORM-like approach to managing data.
It features a custom-built query builder and an abstraction for Ceramic interactions.

## Data lifecycle
All data is always stored on Ceramic and only then does it get indexed and stored in OrbisDB.

This ensures data ownership, integrity and composability with minimal performance sacrifices.

## Plugins
As explained before, each OrbisDB instance can be enhanced with plugins. Plugins can use four different hooks:
 - `generate` to **Create streams**: Automatically create new streams based on external data sources (ie. blockchain event, a local CSV file or an API data source).
- `add_metadata` to **Add metadata**: Modifies or enhances the stream content before indexing (ie. classify the content using AI, fetch the ENS name of the stream’s controller)
- `validate` to **Validate / Gate:** Checks the stream details and decides whether it should be indexed or not (for moderation, token gating or sybil resistance)
- `post_process` to **Perform an action**: Performs actions **after** a stream has been indexed (ie. send an email or a push notification, trigger a blockchain transaction...).

You can find multiple examples of plugins in the `server/plugins` directory.

### Plugin structure
Here is a very simple example of how an `HelloWorld` plugin looks like:

```javascript
export default class HelloWorldPlugin {
  /**
   * This will initialize all of the hooks used by this plugin.
   * A plugin can register multiple hooks, each hook being linked to a function that will be executed when the hook is triggered
   */
  async init() {
    return {
      HOOKS: {
        "generate": () => this.start(),
        "validate": (stream) => this.isValid(stream),
        "add_metadata": (stream) => this.hello(stream),
      },
      ROUTES: {
        "hello": this.helloApi,
        "hello-html": this.helloHtmlApi,
      },
    };
  }

  /** Will kickstart the generation of a new stream */
  async start() {
    console.log("Start subscription in HelloWorld plugin to generate a new stream every " + this.secs_interval + " seconds");
    
    // Perform first call
    this.createStream();

    // Start the interval function
    if(this.secs_interval) {
      this.interval = setInterval(() => {
          this.createStream();
      }, this.secs_interval * 1000);  
    } else {
      console.log("The interval hasn't been specified.");
    }
    
  }

  /** Will stop the plugin's interval */
  async stop() {
      console.log('Stopping plugin:', this.uuid);
      if(this.interval) {
          clearInterval(this.interval);
          this.interval = null; // Clear the stored interval ID
      }
  }

  async createStream() {
    console.log("Enter createStream in HelloWorld plugin.");
    this.model_id ="kjzl6hvfrbw6c646f9as8ecl9ni6l5qh06hxnx1gbectvymjwjiz48dtlkadyrp";

    /** We then create the stream in Ceramic with the updated content */
    try {
      let stream = await global.indexingService.ceramic.orbisdb.insert(this.model_id).value({
        body: "hello world!",
        mention: ""
      }).context(this.context).run();
      console.log("Stream created in HelloWorld plugin.");
    } catch(e) {
        console.log("Error creating stream with model:" + this.model_id + ":", e);
    }
  }

  /** Will mark al of the streams as valid */
  isValid() {
    return true;
  }

  /** Returns a simple hello:world key value pair which will be added to the plugins_data field */
  async hello(stream) {
    return {
      hello: "world"
    }
  }


  /** Example of an API route returning a simple json object. The routes declared by a plugin are automatically exposed by the OrbisDB instance */
  helloApi(req, res) {
    res.json({
      hello: "world"
    })
  }

  /** Example of an API route returning a simple HTML page. The routes declared by a plugin are automatically exposed by the OrbisDB instance */
  helloHtmlApi(req, res) {
    res.send(`<!DOCTYPE html>
      <html>
        <head>
          <title>Simple Page</title>
        </head>
        <body>
          <h1>Hello, this is a simple HTML page</h1>
          <p>More content here...</p>
        </body>
      </html>`);
  }
}
```

As you can see plugins can use `hooks` and expose `routes`: 
- **Hooks**: Those hooks are being called during the lifecycle of a stream within OrbisDB. Sometimes **before** the indexing (`validate` and `add_metadata` hooks) in order to enhance the stream with additional metadata or validate a stream against rules specified by the plugin or **after** the indexing (`post_process` hook) to perform specific actions (such as trigger an email notification). The `generate` hook can even be used to create Ceramic streams automatically. Plugin developers can have their plugin perform any action they want within those hooks.
- **Routes**: Plugins can expose their own routes which can be used as API endpoints or even HTML pages. For example, the `csv-uploader` plugin is exposing a simple HTML route to display a **Select file** button to have users upload their CSV file.

The `hooks` and `routes` must be initiated in the `init()` function the same way we do in the example above.

Plugins must have settings located in a `settings.json` file within the plugin's directory, for our `HelloWorld` example the settings look like this.

```json
{
  "id": "hello-world",
  "name": "Hello World",
  "logo": "/img/hello-world-logo.png",
  "description": "Useless demo plugin. Don't use.",
  "hooks": ["add_metadata", "generate", "validate"],
  "variables": [
    {
      "name": "Interval",
      "description": "Interval in seconds to create a new test stream.",
      "id": "secs_interval",
      "type": "integer",
      "per_context": true
    }
  ]
}

```

Settings are exposing some key details of the plugin which will be used in the OrbisDB UI as well as **variables**. Those variables will be applied when the user installs the plugin. Here are some types of variables that we started using in our own plugins:
- API keys
- The model ID to use by the plugin
- Interval in seconds to wait before generating a new stream
- API endpoint to call for a moderation plugin
- And any other variables that could be required by the plugin

If you want to explore more complex variables we recommend looking into the [`chat-gpt` plugin](https://github.com/OrbisWeb3/orbisdb/tree/master/server/plugins/chat-gpt).

Plugins can access global variables from OrbisDB such as `global.indexingService.ceramic.orbisdb`. Which means that plugins can both query existing data from the OrbisDB instance using `const result = await global.indexingService.ceramic.orbisdb.select().from(<MODEL_ID>).context(<CONTEXT_ID>).limit(10).run();` as well as create new streams using `const document = await global.indexingService.ceramic.orbisdb.insert(<MODEL_ID>).value({body: "gm"}).context(<CONTEXT_ID>).run();` which can unlock a lot of cool new use cases for Ceramic.
