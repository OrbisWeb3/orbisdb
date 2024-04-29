import nextBuild from "next/dist/build/index.js";

import { fileURLToPath } from "url";
import path, { dirname } from "path";
import { Worker, isMainThread, parentPort } from "worker_threads";

/** Initialize dirname */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (!isMainThread) {
  try {
    await nextBuild.default(path.resolve(__dirname, "../client"));
  } catch (e) {
    parentPort.postMessage(e);
    process.exit(1);
  }

  process.exit(0);
}

export default async function buildNextApp() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const output = [];

  const worker = new Worker(path.resolve(__dirname, "./nextBuild.js"));

  worker.on("error", (e) => output.push(e));
  worker.on("message", (e) => output.push(e));
  worker.on("exit", (code) =>
    code === 0
      ? resolve(true)
      : reject(output.length ? output.join(", ") : `Exit code: ${code}`)
  );

  return promise;
}
