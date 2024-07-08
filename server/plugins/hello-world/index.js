import logger from "../../logger/index.js";

export default class HelloWorldPlugin {
  /**
   * This will initialize all of the hooks used by this plugin.
   * A plugin can register multiple hooks, each hook being linked to a function that will be executed when the hook is triggered
   */
  async init() {
    return {
      HOOKS: {
        generate: () => this.start(),
        validate: (stream) => this.isValid(stream),
        add_metadata: (stream) => this.hello(stream),
      },
      ROUTES: {
        GET: {
          hello: this.helloApi,
          "hello-html": this.helloHtmlApi,
        },
      },
    };
  }

  /** Will kickstart the generation of a new stream */
  async start() {
    logger.debug(
      "Start subscription in HelloWorld plugin to generate a new stream every " +
        this.secs_interval +
        " seconds"
    );

    // Perform first call
    this.createStream();

    if (!this.secs_interval) {
      return logger.error("The interval hasn't been specified");
    }

    // Start the interval function
    this.interval = setInterval(
      () => {
        this.createStream();
      },
      // Make sure we don't exceed timeout interval
      Math.min(this.secs_interval * 1000, 2147483647)
    );
  }

  /** Will stop the plugin's interval */
  async stop() {
    logger.debug("Stopping plugin:", this.uuid);
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null; // Clear the stored interval ID
    }
  }

  async createStream() {
    logger.debug("Enter createStream in HelloWorld plugin.");
    this.model_id =
      "kjzl6hvfrbw6cajk0869qi0tthihoy9q8kycwymavzho6b66p9d9qi3yplnv4is";

    /** We then create the stream in Ceramic with the updated content */
    try {
      let stream = await global.indexingService.ceramic.orbisdb
        .insert(this.model_id)
        .value({
          body: "hello world!",
        })
        .context(this.context)
        .run();
      logger.debug("Stream created in HelloWorld plugin.");
    } catch (e) {
      logger.error(
        "Error creating stream with model:" + this.model_id + ":",
        e
      );
    }
  }

  /** Will mark al of the streams as valid */
  isValid() {
    return true;
  }

  /** Returns a simple hello:world key value pair which will be added to the plugins_data field */
  async hello(stream) {
    return {
      hello: "world",
    };
  }

  /** Example of an API route returning a simple json object. The routes declared by a plugin are automatically exposed by the OrbisDB instance */
  async helloApi(req, res) {
    return {
      hello: "world",
    };
  }

  /** Example of an API route returning a simple HTML page. The routes declared by a plugin are automatically exposed by the OrbisDB instance */
  async helloHtmlApi(req, res) {
    res.type("text/html");

    return `<!DOCTYPE html>
      <html>
        <head>
          <title>Simple Page</title>
        </head>
        <body>
          <h1>Hello, this is a simple HTML page</h1>
          <p>More content here...</p>
        </body>
      </html>`;
  }
}
