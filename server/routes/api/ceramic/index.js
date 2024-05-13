// Prefixed with /api/ceramic/
export default async function (server, opts) {
  server.get("/local/status", async (req, res) => {
    try {
      const local_healtcheck_url =
        "http://localhost:7007/api/v0/node/healthcheck";
      const response = await fetch(local_healtcheck_url);

      if (response.status !== 200) {
        return res.internalServerError(await response.text());
      }

      return {
        status: "OK",
      };
    } catch (e) {
      return res.notFound("There are no Ceramic nodes running locally.");
    }
  });
}
