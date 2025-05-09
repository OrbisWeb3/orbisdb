import Fastify from "fastify";

import cors from "@fastify/cors";
import fastifySensible from "@fastify/sensible";
import fastifyStatic from "@fastify/static";
import fastifyMultipart from "@fastify/multipart";

// All routes are prefixed and handled under this module
// with the exception of NextJS and static wildcards
import ServerRoutes from "./routes/index.js";

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

import { cliColors } from "./utils/cliColors.js";

// NextJS and its APIs
import next from "next";
import buildNextApp from "../scripts/nextBuild.js";

import IndexingService from "./indexing/index.js";
import Ceramic from "./ceramic/config.js";
import Postgre from "./db/postgre.js";
import HookHandler from "./utils/hookHandler.js";

import { getOrbisDBSettings } from "./utils/helpers.js";
import logger from "./logger/index.js";

import { registerGraphQLRoute } from "./routes/graphql/index.js";

/** Initialize dirname */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create an instance of the application using Next JS pointing to the front-end files located in the client folder
const dev = process.env.NODE_ENV !== "production";
const nextJs = next({
  dev,
  dir: "./client",
});

// Initialize the main Fastify instance
global.server;

const PORT = process.env.PORT || 7008;

async function startServer(databases) {
  /** Start the Fastify server */
  const server = new Fastify({
    bodyLimit: 50000000,
    ignoreTrailingSlash: true,
  });

  global.server = server;

  // We're running in production and there's no NextJS build output
  if (
    !dev &&
    !fs.existsSync(path.resolve(__dirname, "../client/.next/BUILD_ID"))
  ) {
    logger.warn(
      "Running in production mode with no NextJS build. Running the build..."
    );

    try {
      await buildNextApp();
    } catch (e) {
      logger.error("Unable to start the app, NextJS build failed:", e);
      process.exit(1);
    }

    logger.info(
      "Successfully built the NextJS app and ready to serve in production."
    );
  }

  await nextJs.prepare();
  const nextRequestHandler = nextJs.getRequestHandler();

  await server.register(cors, {});
  await server.register(fastifySensible, {});
  await server.register(fastifyMultipart, {
    limits: {
      fileSize: 50000000,
    },
  });

  await server.register(ServerRoutes);

  // Setup GraphQL
  // Register GraphQL routes for all databases
  const gqlSchemaPromises = [];
  for (const [slot, db] of Object.entries(databases)) {
    gqlSchemaPromises.push(registerGraphQLRoute(server, slot, db));
  }

  const gqlSchemaResults = await Promise.allSettled(gqlSchemaPromises);

  if (!dev) {
    // Serve static files from Next.js production build
    logger.debug("Using production build.");
    server.register(fastifyStatic, {
      prefix: "/public/",
      root: path.join(__dirname, "../client/public"),
    });

    server.register(fastifyStatic, {
      root: path.join(__dirname, "../client/.next"),
      prefix: "/_next/",
      decorateReply: false,
    });
  }

  // Default catch-all handler to allow Next.js to handle all other routes:
  server.route({
    method: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    exposesHeadRoute: false,
    url: "*",
    handler: async (req, res) => {
      return nextRequestHandler(req.raw, res.raw);
    },
  });

  const hostInformation = await server.listen({
    // TODO: make it exposable
    host: "127.0.0.1",
    port: PORT,
  });

  logger.info(
    cliColors.text.cyan,
    "📞 OrbisDB UI ready on",
    cliColors.reset,
    hostInformation
  );
}

/** Initialize the app by loading all of the required plugins while initializing those and start the indexing service */
export async function startIndexing() {
  // Retrieve OrbisDB current settings
  let settings = getOrbisDBSettings();
  let globalDbConfig = settings?.configuration?.db;
  let globalCeramicConfig = settings?.configuration?.ceramic;

  // Initialize some objects
  let ceramics = {};
  let globalCeramic;
  let databases = {};
  let globalDatabase;

  // Initiate global Ceramic
  if (settings?.configuration) {
    let globalSeed = globalCeramicConfig.seed;
    globalCeramic = new Ceramic(
      globalCeramicConfig.node,
      "http://localhost:" + PORT,
      globalSeed
    );

    /** Instantiate the global database to use which should be saved in the "orbisdb-settings.json" file */
    globalDatabase = await Postgre.initialize(
      globalDbConfig.user,
      globalDbConfig.database,
      globalDbConfig.password,
      globalDbConfig.host,
      globalDbConfig.port,
      "global"
    );
  } else {
    logger.error(
      "Couldn't init OrbisDB because configuration isn't setup yet."
    );
    //return;
  }

  if (settings.is_shared) {
    const databasePromises = [];
    const resolvePromiseWithKey = async (key, promise) => {
      try {
        const database = await promise;
        return [key, database];
      } catch (err) {
        throw `Error initializing database for ${key}: ${err}`;
      }
    };
    /** Create one postgre and ceramic object per slot */
    if (settings.slots) {
      for (const [key, slot] of Object.entries(settings.slots)) {
        logger.debug("Trying to configure indexing for:", key);
        if (slot.configuration) {
          /** Instantiate the database to use for this slot */
          let slotDbConfig = slot.configuration.db;

          databasePromises.push(
            resolvePromiseWithKey(
              key,
              Postgre.initialize(
                globalDbConfig.user,
                slotDbConfig.database,
                globalDbConfig.password,
                globalDbConfig.host,
                globalDbConfig.port,
                key
              )
            )
          );

          /** Instantiate the Ceramic object with node's url from config's slot */
          let seed = slot.configuration.ceramic.seed;
          let ceramic = new Ceramic(
            globalCeramicConfig.node,
            "http://localhost:" + PORT,
            seed
          );
          ceramics[key] = ceramic;
        } else {
          logger.error(
            "Couldn't init IndexingService for " +
              key +
              " because configuration isn't setup yet."
          );
        }
      }
    }

    const resolvedPromises = await Promise.allSettled(databasePromises);
    for (const result of resolvedPromises) {
      if (result.status === "rejected") {
        console.error(result.reason);
        continue;
      }

      const [key, database] = result.value;
      databases[key] = database;
      console.log(`Initialized slot ${key}`);
    }
  }

  // If configuration settings are valid we start the indexing service
  if (settings?.configuration) {
    databases["global"] = globalDatabase;
    ceramics["global"] = globalCeramic;

    /** Initialize the hook handler */
    let hookHandler = new HookHandler();

    /** Initialize the mainnet indexing service while specifying the plugins to use and database type only if setting configuration exists */
    global.indexingService = new IndexingService(
      globalCeramic, // The global ceramic object will be used to subscribe to SSE
      globalDatabase, // The global database (used for example to create other slot's db or for non shared instances)
      ceramics, // The slots individual Ceramic object will be used by plugins installed on the corresponding slot and in the UI
      databases, // Database instance to use
      hookHandler, // Hookhandler
      global.server,
      settings.is_shared ? settings.is_shared : false
    );

    /** Subscribe to streams created on Mainnet */
    global.indexingService.subscribe();
  }

  // Start the server after initializing the database
  startServer(databases).catch(logger.error);
}

/** Initialize indexing service */
startIndexing();
