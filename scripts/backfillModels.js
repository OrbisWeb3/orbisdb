// TODO: Turn into a proper script and deprecate (models_indexed is the default behavior)

import { OrbisDB } from "@useorbis/db-sdk";
import Postgre from "../server/db/postgre.js";
import { getOrbisDBSettings } from "../server/utils/helpers.js";

const main = async () => {
  const orbis = new OrbisDB({
    ceramic: {
      gateway: "",
    },
    nodes: [
      {
        gateway: "",
      },
    ],
  });

  const settings = getOrbisDBSettings();
  for (const [slot, slotSettings] of Object.entries(settings.slots)) {
    const databaseSettings = slotSettings?.configuration?.db;
    if (!databaseSettings) {
      console.log(`No settings found for ${slot}`);
      continue;
    }

    let database;
    try {
      database = await Postgre.initialize(
        databaseSettings.user,
        databaseSettings.database,
        databaseSettings.password,
        databaseSettings.host,
        databaseSettings.port,
        slot
      );
    } catch (err) {
      console.log(`Failed to initialize database for slot: ${slot}`);
      continue;
    }

    const { data: indexedData } = await database.query_schema();
    const tables = indexedData.filter(
      (table) =>
        table.type === "TABLE" &&
        table.table_name !== "kh4q0ozorrgaq2mezktnrmdwleo1d"
    );
    const models = tables.map((table) => table.table_name);
    const mapped_names = slotSettings.models_mapping || {};

    console.log(`Found ${models.length} models for slot ${slot}.`);

    const promises = [];
    const inserts = [];
    for (const modelId of models) {
      promises.push(
        (async () => {
          const model = await orbis.ceramic.getModel(modelId);
          inserts.push({
            stream_id: model.id,
            controller: model.metadata.controller,
            name: model.schema.name,
            mapped_name: mapped_names[model.id] || null,
            content: model.schema,
            indexed_at: new Date(),
          });
        })()
      );
    }

    await Promise.allSettled(promises);

    await Promise.allSettled(
      inserts.map((data) =>
        database.upsertRaw("kh4q0ozorrgaq2mezktnrmdwleo1d", data)
      )
    );

    console.log(`Done with slot: ${slot}`);
  }

  return "Done backfilling data";
};

main()
  .then(console.log)
  .catch(console.error)
  .finally(() => process.exit(0));
