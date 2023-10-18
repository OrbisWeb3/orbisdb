/**
 * HelloWorld plugin simply adding hello world key / value pair in the indexing data
 */
export default class HelloWorldPlugin {
  constructor() {
    console.log("Initialized HelloWorldPlugin.");
    this.name = 'HelloWorldPlugin';
    this.type = 'pre-processor';
  }

  async process(stream) {
    console.log("Processing HelloWorld plugin.");
    // Enhance the content
    return {
        ...stream.indexingData,
        hello: "world"
    };
  }
}
