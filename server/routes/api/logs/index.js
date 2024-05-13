import { adminDidAuthMiddleware } from "../../../middleware/didAuthMiddleware.js";
import fs from "fs";

const parseLogName = (log) => {
  const split = log.split(".");
  const extension = split.pop();

  if (extension !== "log") {
    return false;
  }

  const level = split.pop();
  const date = split.pop().split("-");

  const dateH = `${date.pop()}:00`;
  const dateM = date.join("-");

  return {
    id: log,
    level,
    timestamp: new Date(`${dateM} ${dateH}`).getTime(),
  };
};

const sortLogs = (logs) => {
  const clone = [...logs];
  clone.sort((logA, logB) => logB.timestamp - logA.timestamp);
  return clone;
};

const listLogfiles = (level = false) => {
  const logs = fs
    .readdirSync("./server/logs")
    .map((log) => parseLogName(log))
    .filter((log) => log && (level ? log.level === level : true));

  return sortLogs(logs);
};

export default async function (server, opts) {
  server.addHook("onRequest", adminDidAuthMiddleware);

  server.get("/", async (req, res) => {
    return {
      logs: listLogfiles(req.query.level),
      level: req.query.level || "all",
    };
  });

  server.get("/:id", async (req, res) => {
    const { id } = req.params;
    const logIds = listLogfiles().map((log) => log.id);

    if (!logIds.includes(id)) {
      return res.notFound(`Invalid log file provided: ${id}.`);
    }

    const log = fs
      .readFileSync(`./server/logs/${id}`)
      .toString()
      .split(/\r?\n/);

    return {
      ...parseLogName(id),
      logs: log.filter((event) => event).map((event) => JSON.parse(event)),
    };
  });
}
