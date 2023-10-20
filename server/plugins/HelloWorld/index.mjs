
export default class HelloWorldPlugin {
  constructor() {
    this.id = "HelloWorldPlugin";
  }

  /**
   * This will initialize all of the hooks used by this plugin.
   * A plugin can register multiple hooks, each hook being linked to a function that will be executed when the hook is triggered
   */
  async init() {
    return {
      HOOKS: {
        "validate": (stream) => this.isValid(stream),
        "add_metadata": (stream) => this.hello(stream),
      },
    };
  }

  isValid() {
    return true;
  }

  // Returns a simple hello:world key value pair which will be added to the pluginsData field
  async hello(stream) {
    return {
      hello: "world"
    }
  }
}
