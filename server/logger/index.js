import * as winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import util from "util";

import { cliColors } from "../utils/cliColors.js";

function reduceCliColors(colors) {
  const merged = [];

  for (const color of Object.values(colors)) {
    if (typeof color === "object") {
      merged.push(...reduceCliColors(color));
    } else {
      merged.push(color);
    }
  }

  return merged;
}

const colorArray = reduceCliColors(cliColors);

const sanitizeColors = (messages) => {
  const sanitized = [];

  for (const message of messages) {
    if (colorArray.includes(message)) {
      continue;
    }

    sanitized.push(message);
  }

  return sanitized;
};

// TODO: make it relative via dirname
const logsDir = "./server/logs";

const errorFileRotate = new DailyRotateFile({
  level: "error",
  filename: "%DATE%.error.log",
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "5",
  dirname: logsDir,
});

const infoFileRotate = new DailyRotateFile({
  level: "info",
  filename: "%DATE%.info.log",
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: true,
  maxSize: "10m",
  maxFiles: "1",
  dirname: logsDir,
});

const debugFileRotate = new DailyRotateFile({
  level: "debug",
  filename: "%DATE%.debug.log",
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: true,
  maxSize: "10m",
  maxFiles: "1",
  dirname: logsDir,
});

export const _logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, label, timestamp }) => {
      return JSON.stringify({
        level,
        message: util.format(...sanitizeColors(message)),
        label,
        timestamp,
      });
    })
  ),
  transports: [
    errorFileRotate,
    debugFileRotate,
    infoFileRotate,
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.printf(({ level, message, label }) => {
        return `[${level.toUpperCase()}${label ? `:${label}` : ""}] ${util.format(...message)}`;
      }),
    }),
  ],
});

const logger = {
  info: (...msgs) => _logger.info(msgs),
  warn: (...warns) => _logger.warn(warns),
  error: (...errors) => _logger.error(errors),
  debug: (...msgs) => _logger.debug(msgs),
};

export default logger;
