import { adminDidAuthMiddleware } from "../../../middleware/didAuthMiddleware.js";
import fs from "fs";

const filterLogs = (logs, level) => {
  if (level) {
    return logs.filter((log) => {
      const split = log.split(".");
      return split.pop() === "log" && split.pop() === level;
    });
  }

  return logs.filter((log) => log.split(".").pop() === "log");
};

const sortLogs = (logs) =>
  logs.sort((logA, logB) => {
    const logASplit = logA.split(".")[0].split("-");
    const logBSplit = logB.split(".")[0].split("-");

    const hourA = logASplit.pop();
    const hourB = logBSplit.pop();

    return (
      new Date(`${logBSplit.join("-")} ${hourB}:00`) -
      new Date(`${logASplit.join("-")} ${hourA}:00`)
    );
  });

const listLogfiles = (level = false) => {
  return sortLogs(filterLogs(fs.readdirSync("./server/logs"), level));
};

export default async function (server, opts) {
  server.addHook("onRequest", adminDidAuthMiddleware);

  server.get("/", async (req, res) => {
    return {
      logs: listLogfiles(req.query.level),
      level: req.query.level || "all",
    };
  });

  server.get("/:log", async (req, res) => {
    const { log } = req.params;
    const logs = listLogfiles();

    if (!logs.includes(log)) {
      return res.notFound(`Invalid log file provided: ${log}.`);
    }

    const readLog = fs
      .readFileSync(`./server/logs/${log}`)
      .toString()
      .split(/\r?\n/);

    return {
      log,
      level: log.split(".").splice(-2, 1)[0],
      logs: readLog.filter((log) => log).map((log) => JSON.parse(log)),
    };
  });
}
