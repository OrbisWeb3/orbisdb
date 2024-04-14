import { ModelInstanceDocument } from "@ceramicnetwork/stream-model-instance";
import { StreamID } from "@ceramicnetwork/streamid";

export default class SocialPushNotificationPlugin {
  /**
   * This will initialize all of the hooks used by this plugin.
   * A plugin can register multiple hooks, each hook being linked to a function that will be executed when the hook is triggered
   */
  async init() {
    this.social_post_model =
      "kjzl6hvfrbw6c646f9as8ecl9ni6l5qh06hxnx1gbectvymjwjiz48dtlkadyrp";
    this.social_profile_model =
      "kjzl6hvfrbw6c9q2rtmzylcuvba782ck7co36wnoppn9x80qsq2oas01ou1zgwr";
    //this.createTestPost();
    return {
      HOOKS: {
        post_process: (stream) => this.process(stream),
      },
    };
  }

  /** Will process the new stream in order to trigger a push notification if it follows some specific criteria */
  async process(stream) {
    console.log("Process stream in SocialPushNotificationPlugin:", stream);
    if (stream.model == this.social_post_model) {
      this.handleNewPost(stream);
    } else {
      return;
    }
  }

  /** Will handle the new post creation in order to trigger a push and/or email notification if there are any */
  async handleNewPost(stream) {
    let mentionnedUsers = [];

    // Retrieve profile from OrbisDB to retrieve push token
    switch (stream.content.mention) {
      // Handle mention @everyone
      case "everyone":
        mentionnedUsers = this.getEveryoneTokens();
        break;

      // Handle normal mentions
      default:
        mentionnedUsers = this.getUsersToken(stream.content.mention);
        break;
    }

    // Trigger push notification for those users
    let message;
    this.sendNotifications(mentionnedUsers, message);
  }

  /** Will retrieve user's token from OrbisDB then decrypt it */
  async getUsersToken(did) {
    let mentionedUser;
    let mentionedUserArr = global.indexingService.ceramic.orbisdb
      .select()
      .from(this.social_profile_model)
      .where({ controller: did })
      .first();
    if (mentionedUserArr) {
      mentionedUser = mentionedUserArr[0];
      console.log("mentionedUser:", mentionedUser);
    } else {
      console.log("We couldn't find this mentioned user.");
    }

    return [mentionedUser];
  }

  /** Will retrieve all of the users of the app and get their tokens */
  async getEveryoneTokens() {
    return [];
  }

  /** Will trigger a push notification for all of the users */
  async sendNotifications(users, message) {}

  async createTestPost() {
    let metadata = {
      model: StreamID.fromString(this.social_post_model),
      context: StreamID.fromString(this.context),
    };
    console.log("metadata:", metadata);
    let content = {
      body: "hello world",
      mention: "did:key:z6MkkauvinSwdvqT6k44GZG6MArjD3qXiiEwfi5sKiHJ3JaE",
    };
    /** We then create the stream in Ceramic with the updated content */
    try {
      let stream = await ModelInstanceDocument.create(
        global.indexingService.ceramic.client,
        content,
        metadata
      );
      let stream_id = stream.id?.toString();
      console.log("stream_id:", stream_id);
    } catch (e) {
      console.log("Error creating stream with model:" + this.model_id + ":", e);
    }
  }
}
