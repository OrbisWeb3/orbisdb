import ora from 'ora'

import { spawn } from "child_process"
import { EventEmitter } from 'events'
import { writeComposite } from './composites.mjs';

const events = new EventEmitter()
const spinner = ora();

const credentials = async () => {
  spinner.info("[Ceramic] creating admin credentials");
  const admin = spawn('npm', ['run', 'generate'])
  spinner.succeed("Ceramic] admin credentials created");
  admin.stdout.on('data', (buffer) => {
    console.log('[Ceramic]', buffer.toString())
  })
}

const ceramic = spawn("npm", ["run", "ceramic"]);
ceramic.stdout.on("data", (buffer) => {
  console.log('[Ceramic]', buffer.toString())
  if (buffer.toString().includes("IMPORTANT: Ceramic API running")) {
    events.emit("ceramic", true);
    spinner.succeed("ceramic node started");
  }
})

ceramic.stderr.on('data', (err) => {
  console.log(err.toString())
})

const bootstrap = async () => {
  // TODO: convert to event driven to ensure functions run in correct orders after releasing the bytestream.
  // TODO: check if .grapql files match their .json counterparts
  //       & do not create the model if it already exists & has not been updated
  try {
    spinner.info("[Composites] bootstrapping composites");
    await writeComposite(spinner)
    spinner.succeed("Composites] composites bootstrapped");
  } catch (err) {
    spinner.fail(err.message)
    ceramic.kill()
    throw err
  }
}

const graphiql = async () => {
  spinner.info("[GraphiQL] starting graphiql");
  const graphiql = spawn('node', ['./scripts/graphiql.mjs'])
  spinner.succeed("[GraphiQL] graphiql started");
  graphiql.stdout.on('data', (buffer) => {
    console.log('[GraphiqQL]',buffer.toString())
  })
}

const next = async () => {
  const next = spawn('npm', ['run', 'nextDev'])
  spinner.info("[NextJS] starting nextjs app");
  next.stdout.on('data', (buffer) => {
    console.log('[NextJS]', buffer.toString())
  })
}

const start = async () => {
  try {
    await credentials()
    spinner.start('[Ceramic] Starting Ceramic node\n')
    events.on('ceramic', async (isRunning) => {
      if (isRunning) {
        await bootstrap()
        await graphiql()
        await next()
      }
      if(isRunning === false) {
        ceramic.kill()
        process.exit()
      }
    })
  } catch (err) {
    ceramic.kill()
    spinner.fail(err)
  }
}

start()

process.on("SIGTERM", () => {
  ceramic.kill();
});
process.on("beforeExit", () => {
  ceramic.kill();
});
