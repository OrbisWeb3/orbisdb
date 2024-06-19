import { adminDidAuthMiddleware } from "../../../middleware/didAuthMiddleware.js";

import { SelectStatement } from "@useorbis/db-sdk/query";
import { getOrbisDBSettings } from "../../../utils/helpers.js";
import logger from "../../../logger/index.js";

// Prefixed with /api/db/
export default async function (server, opts) {
  await server.register(async function (server) {
    await server.addHook("onRequest", adminDidAuthMiddleware);

    // API endpoint to query a table
    server.post("/query/all", async (req, res) => {
      const { table, page, context, order_by_indexed_at } = req.body;

      // Retrieve admin
      let adminDid = req.adminDid;

      // Retrieve global settings
      let settings = getOrbisDBSettings();

      // If this is a shared instance we select the right db to query or use the global one
      let database = global.indexingService.databases["global"];
      if (adminDid && settings.is_shared) {
        database = global.indexingService.databases[adminDid];
      }

      try {
        let response = await database.queryGlobal(
          table,
          parseInt(page, 10),
          true,
          context
        );
        console.log("response in query/all:", response);
        if (response && response.data) {
          return {
            columns: response.data.fields,
            data: response.data.rows,
            totalCount: response.totalCount,
            title: response.title,
          };
        } else {
          // TODO: Check where used, use appropriate res.notFound
          res.status(404);
          return {
            columns: response?.data?.fields ? response.data.fields : [],
            data: [],
            error: `There wasn't any results returned from table ${table}.`,
          };
        }
      } catch (error) {
        logger.error(error);
        return res.internalServerError(
          `Internal server error while querying table ${table}.`
        );
      }
    });

    /** Will run the query wrote by user */
    server.post("/query/raw", async (req, res) => {
      const { query, params } = req.body;

      // Retrieve admin
      const adminDid = req.adminDid;

      // Retrieve global settings
      const settings = getOrbisDBSettings();

      // If this is a shared instance we select the right db to query or use the global one
      let database = global.indexingService.databases["global"];
      if (adminDid && settings.is_shared) {
        database = global.indexingService.databases[adminDid];
      }

      try {
        const response = await database.query(query, params);
        if (!response) {
          res.status(404);
          return {
            columns: response?.data?.fields ? response.data.fields : [],
            data: [],
            error: `There wasn't any results returned from table.`,
          };
        }

        return {
          columns: response?.data?.fields ? response.data.fields : [],
          data: response.data?.rows ? response.data.rows : [],
          error: response.error,
          totalCount: response.totalCount,
          title: response.title,
        };
      } catch (error) {
        logger.error(error);
        return res.internalServerError(
          "Internal server error while querying table."
        );
      }
    });

    /** Will return the schema for a database */
    server.get("/schema", async (req, res) => {
      // Retrieve admin
      let adminDid = req.adminDid;

      // Retrieve global settings
      let settings = getOrbisDBSettings();

      // If this is a shared instance we select the right db to query or use the global one
      let database = global.indexingService.databases["global"];
      if (adminDid && settings.is_shared) {
        database = global.indexingService.databases[adminDid];
      }

      // Perform query
      try {
        let response = await database.query_schema();
        if (!response) {
          res.status(404);
          return {
            data: [],
            error: `There wasn't any results returned from table.`,
          };
        }

        return {
          data: response.data?.rows,
          totalCount: response.totalCount,
          title: response.title,
        };
      } catch (error) {
        logger.error(error);
        return res.internalServerError(
          `Internal server error while querying table schemas.`
        );
      }
    });

    /** Will force index a model */
    server.post("/index/model", async (req, res) => {
      const { model_id } = req.body;
      console.log("Enter /index/model with model_id:", model_id);

      // Retrieve admin
      const adminDid = req.adminDid;

      // Retrieve global settings
      const settings = getOrbisDBSettings();

      // If this is a shared instance we select the right db to query or use the global one
      let database = global.indexingService.databases["global"];
      if (adminDid && settings.is_shared) {
        database = global.indexingService.databases[adminDid];
      }

      try {
        const response = await database.indexModel(model_id, null, true);
        if (!response) {
          res.status(404);
          return {
            error: `Couldn't index this model: ` + model_id,
          };
        }

        return {
          message: "Indexed model " + model_id + " with success."
        };
      } catch (error) {
        logger.error(error);
        return res.internalServerError(
          "Internal server error while indexing model."
        );
      }
    });
  });

  /** Will build a query from JSON and run it */
  server.post("/query/json", async (req, res) => {
    const { jsonQuery, env } = req.body;
    console.log("jsonQuery:", jsonQuery);
    console.log("env:", env);
    const slot = env;

    const { query, params } = SelectStatement.buildQueryFromJson(jsonQuery);

    // Retrieve global settings
    const settings = getOrbisDBSettings();
    logger.debug("slot:", slot);
    logger.debug("env:", env);

    // If this is a shared instance we select the right db to query or use the global one
    let database = global.indexingService.databases["global"];
    if (slot && settings.is_shared) {
      database = global.indexingService.databases[slot];
    }
    console.log("database:", database);

    try {
      const response = await database.query(query, params);
      if (!response) {
        res.status(404);
        return {
          data: [],
          error: `There wasn't any results returned from table.`,
        };
      }

      return {
        data: response.data?.rows,
        totalCount: response.totalCount,
        title: response.title,
      };
    } catch (error) {
      logger.error(error);

      res.internalServerError("Internal server error while querying table.");
    }
  });
}
