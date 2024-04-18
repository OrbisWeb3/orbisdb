import * as winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const errorFileRotate = new DailyRotateFile({
  level: "error",
  filename: "%DATE%.error.log",
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "5",
  dirname: "../.logs",
});

const infoFileRotate = new DailyRotateFile({
  level: "info",
  filename: "%DATE%.info.log",
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: true,
  maxSize: "10m",
  maxFiles: "1",
  dirname: "../.logs",
});

const debugFileRotate = new DailyRotateFile({
  level: "debug",
  filename: "%DATE%.debug.log",
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: true,
  maxSize: "10m",
  maxFiles: "1",
  dirname: "../.logs",
});

export const logger = winston.createLogger({
  transports: [
    errorFileRotate,
    debugFileRotate,
    infoFileRotate,
    ...((process.env.NODE_ENV !== "production" &&
      new winston.transports.Console({
        level: process.env.LOG_LEVEL || "info",
      })) ||
      []),
  ],
});

export default logger;
