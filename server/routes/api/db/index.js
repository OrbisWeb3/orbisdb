import { adminDidAuthMiddleware } from "../../../middleware/didAuthMiddleware.js";

import { SelectStatement } from "@useorbis/db-sdk/query";
import {
  getOrbisDBSettings,
  updateOrbisDBSettings,
} from "../../../utils/helpers.js";
import logger from "../../../logger/index.js";
import { refreshGraphQLSchema } from "../../graphql/index.js";

// Prefixed with /api/db/
export default async function (server, opts) {
  await server.register(async function (server) {
    await server.addHook("onRequest", adminDidAuthMiddleware);

    // API endpoint to query a table
    server.post("/query/all", async (req, res) => {
      const { table, page, context, order_by_indexed_at, embedding_near } =
        req.body;

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
        // TODO: support embedding_near once defined and used in the frontend
        const response = await database.queryGlobal(
          table,
          parseInt(page, 10),
          true,
          context
        );

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
      console.log("Enter /schema");

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
        let response = await database.query_schema();
        if (!response) {
          res.status(404);
          return res.json({
            data: [],
            error: `There wasn't any results returned from table.`,
          });
        }
        response.data.forEach((table) => {
          table.columns.forEach((column) => {
            if (column.data_type === "vector") {
              column._near = true; // Mark vector fields for special filters
            }
          });
        });
        return {
          data: response.data,
          totalCount: response.totalCount,
          title: response.title,
        };
      } catch (error) {
        console.error(error);
        res.status(500);
        return {
          error: `Internal server error while querying table schemas.`,
        };
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
          message: "Indexed model " + model_id + " with success.",
        };
      } catch (error) {
        logger.error(error);
        return res.internalServerError(
          "Internal server error while indexing model."
        );
      }
    });

    /** Will add a new relation (used in graphql) */
    server.post("/foreign-key", async (req, res) => {
      console.log("Enter /foreign-key");

      // Retrieve admin
      const adminDid = req.adminDid;

      // Retrieve global settings
      const globalSettings = getOrbisDBSettings();
      let settings = getOrbisDBSettings(adminDid);

      const {
        table,
        column,
        referenceName,
        referencedTable,
        referencedColumn,
        referencedType,
      } = req.body;

      try {
        // Update the settings instead of altering the database
        const updatedRelation = {
          table,
          column,
          referenceName,
          referencedTable,
          referencedColumn,
          referencedType,
        };

        if (!settings.relations) {
          settings.relations = {};
        }
        if (!settings.relations[table]) {
          settings.relations[table] = [];
        }

        settings.relations[table].push(updatedRelation);

        // Update the settings file
        updateOrbisDBSettings(settings, adminDid);

        /** Refresh GraphQL schema for this db to make sure it reflects those changes */
        let database = global.indexingService.databases["global"];
        if (adminDid && globalSettings.is_shared) {
          database = global.indexingService.databases[adminDid];
        }
        refreshGraphQLSchema(
          database,
          globalSettings.is_shared ? adminDid : "global"
        );

        return { success: true, settings: settings };
      } catch (err) {
        console.error("Error updating settings:", err);
        return { success: false, message: "Error updating settings" };
      }
    });

    /** Will update an existing relation */
    server.put("/foreign-key", async (req, res) => {
      const {
        table,
        column,
        referenceName,
        referencedTable,
        referencedColumn,
        referencedType,
        index,
      } = req.body;

      // Retrieve admin
      const adminDid = req.adminDid;

      try {
        // Retrieve global settings
        const globalSettings = getOrbisDBSettings();
        let settings = getOrbisDBSettings(adminDid);

        if (!settings.relations[table] || !settings.relations[table][index]) {
          return { success: false, message: "Relation not found" };
        }

        settings.relations[table][index] = {
          table,
          column,
          referenceName,
          referencedTable,
          referencedColumn,
          referencedType,
        };

        updateOrbisDBSettings(settings, adminDid);

        /** Refresh GraphQL schema for this db to make sure it reflects those changes */
        let database = global.indexingService.databases["global"];
        if (adminDid && globalSettings.is_shared) {
          database = global.indexingService.databases[adminDid];
        }
        refreshGraphQLSchema(
          database,
          globalSettings.is_shared ? adminDid : "global"
        );

        return { success: true, settings };
      } catch (err) {
        console.error("Error updating relation:", err);
        return { success: false, message: "Error updating relation" };
      }
    });
  });

  /** Will build a query from JSON and run it */
  server.post("/query/json", async (req, res) => {
    const { jsonQuery, env } = req.body;
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

    // TODO: assume raw SQL for now, query building should be a part of the SDK
    // if (jsonQuery.filter?.embedding_near) {
    //   query += `, embedding <=> $1 AS similarity`;
    //   query += ` ORDER BY similarity LIMIT 10`;
    //   params.push(jsonQuery.filter.embedding_near);
    // }

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
