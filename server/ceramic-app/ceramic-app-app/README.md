# ComposeDB Example App instructions

Due to the nature of the Ceramic Daemon certain files must be updated to work with your local machine. Please follow the following directions carefully to ensure functionality.

This demo uses Ceramic-One (Rust implementation of Ceramic's synchronization layer). As such, running this demo will require Ceramic-One running in the background. The following instructions will include corresponding Ceramic-One instructions.

## Getting Started

1. Install and start up Ceramic-One.

There are multiple ways to do so listed in the [README](https://github.com/ceramicnetwork/rust-ceramic) of the repository, contingent on your local environment. Please follow whichever instructions apply to your machine. Once installed, start the daemon using the instructions found in the [Usage](https://github.com/ceramicnetwork/rust-ceramic?tab=readme-ov-file#usage) section.

2. Back in the root directory of this repository, run `npm install` to install the packages

3. Start the development server with `npm run dev` once. You may continue to use this command if you'd like however it will close all Ceramic connections at the first error. It is recommended that once your node is configured to index the required models that you run `npm run ceramic` & `npm run nextDev` separately to avoid this eager quitting.

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

5. Enjoy this demo application!

## Learn More

Upgrade this project to claynet to see other developer's posts! Check out wheel to install ceramic / composeDB locally:

https://github.com/ceramicstudio/wheel

To learn more about Ceramic please visit the following links

- [Ceramic Documentation](https://developers.ceramic.network/learn/welcome/) - Learn more about the Ceramic Ecosystem.
- [ComposeDB](https://composedb.js.org/) - Details on how to use and develop with ComposeDB!

You can check out [Create Ceramic App repo](https://github.com/ceramicstudio/create-ceramic-app) and provide us with your feedback or contributions!
