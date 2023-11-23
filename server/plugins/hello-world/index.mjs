
export default class HelloWorldPlugin {
  constructor() {
  }

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
  start() {
    console.log("Start subscription in HelloWorld plugin to generate a new stream every x seconds");
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
