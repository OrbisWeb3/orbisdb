
export default class ExampleModerationPlugin {
  constructor() {
    this.id = "ExampleModerationPlugin";
  }

  /**
   * This will initialize all of the hooks used by this plugin.
   * A plugin can register multiple hooks, each hook being linked to a function that will be executed when the hook is triggered
   */
  async init() {
    return {
      HOOKS: {
        "validate": (stream) => this.isValid(stream),
        "add_metadata": (stream) => this.analyzeSentiment(stream),
      },
    };
  }

  // Can check a moderation API to verify whether or not the stream should be indexed
  async isValid(stream) {
    let score = Math.random();
    // Will terminate (stream should be moderated) if score is higher than 0.6
    if(score > 0.6) {
      return false;
    } else {
      return true;
    }
  }

  // This function could analyze the sentiment of the body field for example and return it to make it easier to moderate the content
  async analyzeSentiment(stream) {
    return {
      sentiment: "positive",
      score: Math.random()
    }
  }
}

// Will return a list of streams that have been banned by the API since it started.
/*async function returnBannedIds(request, response) {
  return {
    bannedIds: [],
  };
}*/
