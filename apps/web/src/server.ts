import { createServer } from "node:http";
import { findOpenLibraryBooks, findOpenLibraryCoverId, openCore } from "@bookclub/core";
import { activityLogPath, createActivityLog } from "./activity-log.ts";
import { createApp } from "./app.ts";
import { loadConfig } from "./config.ts";

const config = loadConfig();
const core = openCore(config.sqlitePath);
const app = createApp({
  core,
  secureCookies: config.publicBaseUrl.startsWith("https://"),
  covers: findOpenLibraryCoverId,
  matches: findOpenLibraryBooks,
  activityLog: createActivityLog(activityLogPath(config.sqlitePath)),
});

const port = Number(process.env.PORT ?? 3000);
const server = createServer(async (request, response) => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const requestUrl = new URL(request.url ?? "/", config.publicBaseUrl);
  const result = await app.handle({
    method: request.method ?? "GET",
    path: requestUrl.pathname,
    query: requestUrl.searchParams.toString(),
    headers: {
      cookie: headerValue(request.headers.cookie),
      "content-type": headerValue(request.headers["content-type"]),
    },
    body: Buffer.concat(chunks).toString("utf8"),
  });
  response.writeHead(result.status, result.headers);
  response.end(result.body);
});

server.listen(port, () => {
  console.log(`Book Club listening on ${config.publicBaseUrl}`);
});

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value.join("; ");
  }
  return value;
}
