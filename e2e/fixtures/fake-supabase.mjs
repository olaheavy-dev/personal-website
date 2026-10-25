// A test only stand in for the Supabase REST API, so the flag journeys can run without a
// hosted project. It serves one table, `feature_flags`, and like the real public role
// (row level security) it returns rows that are On only. A control endpoint changes the
// answer while the tests run.
//
//   GET  /rest/v1/feature_flags   the rows, or an error status while one is set
//   GET  /__control               { flags, status, reads }
//   POST /__control               { flags?: { key: "on" }, status?: 500, reset?: true }
//
// Run on its own with `node e2e/fixtures/fake-supabase.mjs`, or wrapped around a command
// with `node e2e/fixtures/with-fake-supabase.mjs <command>`. It listens on 127.0.0.1 only
// and is never part of the app, the image or the deploy.
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { defaultFlags, fakePort } from "./fake-constants.mjs";

export { defaultFlags, fakePort, fakePublishableKey, fakeUrl } from "./fake-constants.mjs";

export function startFakeSupabase({ port = fakePort } = {}) {
  let flags = { ...defaultFlags };
  let status = null;
  let reads = 0;

  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const send = (code, body) => {
      response.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      response.end(JSON.stringify(body));
    };

    if (url.pathname === "/rest/v1/feature_flags" && request.method === "GET") {
      reads += 1;
      if (status) return send(status, { message: "fake outage" });
      return send(
        200,
        Object.entries(flags)
          .filter(([, state]) => state === "on")
          .map(([key, state]) => ({ key, state })),
      );
    }

    if (url.pathname === "/__control") {
      if (request.method === "GET") return send(200, { flags, status, reads });
      if (request.method === "POST") {
        let text = "";
        request.on("data", (chunk) => (text += chunk));
        request.on("end", () => {
          try {
            const body = JSON.parse(text || "{}");
            if (body.reset) {
              flags = { ...defaultFlags };
              status = null;
            }
            if (body.flags) flags = { ...body.flags };
            if ("status" in body) status = body.status;
            send(200, { flags, status, reads });
          } catch {
            send(400, { message: "bad control body" });
          }
        });
        return;
      }
    }

    send(404, { message: "not found" });
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () =>
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(done)),
      }),
    );
  });
}

// Started directly: stay up until stopped.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const fake = await startFakeSupabase();
  console.log(`fake supabase on ${fake.url}`);
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => fake.close().then(() => process.exit(0)));
  }
}
