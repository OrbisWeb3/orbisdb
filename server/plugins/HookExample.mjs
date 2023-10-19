export default class HelloWorldPlugin {
  constructor() {
    this.id = "moderation-plugin";
  }

  async init() {
    return {
      API_ROUTES: {
        "/hello-world": {
          GET: async () => ({
            hello: "world",
          }),
        },
      },
      HOOKS: {
        "moderated_based_on_stream_id": ({ id }) => {
          if (id === "k2t6wzhkhabz51k2e3edqueb92fbs98qc3ks4fjvzfz00ky6nyc37n6bbwoo0y") {
            return {
              reason: "Stream flagged as potential spam."
            };
          }
        },
        "moderate_stream_content": this.moderateContent.bind(this),
      },
    };
  }

  async moderateContent(content) {
    const { profileId } = content;
    if (!profileId) return;

    return {
      profileStatus:
        profileId ===
        "k2t6wzhkhabz33a36ncx5cw6kffljiy0grqh4echaar52fbeq24qx5smax32xo"
          ? "BANNED"
          : "ACTIVE",
    };
  }

  async migrations() {
    // create tables, etc
  }
}
