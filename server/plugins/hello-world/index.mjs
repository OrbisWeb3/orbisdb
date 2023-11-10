
export default class HelloWorldPlugin {
  constructor() {
    this.id = "hello-world-plugin";
  }

  /**
   * This will initialize all of the hooks used by this plugin.
   * A plugin can register multiple hooks, each hook being linked to a function that will be executed when the hook is triggered
   */
  async init() {
    return {
      HOOKS: {
        "generate": () => this.subscribe(),
        "validate": (stream) => this.isValid(stream),
        "add_metadata": (stream) => this.hello(stream),
      },
    };
  }

  subscribe() {
    console.log("Start subscription in HelloWorld plugin to generate a new stream every x seconds");
  }

  isValid() {
    return true;
  }

  /** Returns a simple hello:world key value pair which will be added to the plugins_data field */
  async hello(stream) {
    return {
      hello: "world"
    }
  }
}
