import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { findOpenLibraryBooks, findOpenLibraryCoverId, openCore } from "@bookclub/core";
import { activityLogPath, createActivityLog } from "./activity-log.ts";
import { createApp } from "./app.ts";
import { loadConfig } from "./config.ts";
import { createGoogleBooksLookup } from "./google-books.ts";

const config = loadConfig();
const core = openCore(config.sqlitePath, { initializeDatabase: config.initializeDatabase });
const app = createApp({
  core,
  secureCookies: config.publicBaseUrl.startsWith("https://"),
  covers: findOpenLibraryCoverId,
  matches: findOpenLibraryBooks,
  details: config.googleBooksApiKey ? createGoogleBooksLookup(config.googleBooksApiKey) : undefined,
  activityLog: createActivityLog(activityLogPath(config.sqlitePath)),
});

const port = Number(process.env.PORT ?? 3000);
const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", config.publicBaseUrl);
  const staticAsset = requestUrl.pathname === "/assets/starfield.jpg"
    ? { file: "starfield.jpg", contentType: "image/jpeg" }
    : requestUrl.pathname === "/assets/target-cursor.svg"
      ? { file: "target-cursor.svg", contentType: "image/svg+xml; charset=utf-8" }
      : requestUrl.pathname === "/assets/book-card.svg"
        ? { file: "book-card.svg", contentType: "image/svg+xml; charset=utf-8" }
      : null;
  if (request.method === "GET" && staticAsset) {
    try {
      const asset = await readFile(new URL(`../public/${staticAsset.file}`, import.meta.url));
      response.writeHead(200, {
        "Content-Type": staticAsset.contentType,
        "Cache-Control": "public, max-age=3600",
      });
      response.end(asset);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
    return;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
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
