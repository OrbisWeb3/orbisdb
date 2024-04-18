export default async function (server, opts) {
  server.get("/", async () => "OK");
  server.get("/ping", async () => "pong");
}
