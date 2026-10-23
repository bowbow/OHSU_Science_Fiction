import assert from "node:assert/strict";
import { test } from "node:test";
import { openCore } from "@bookclub/core";
import { createApp } from "../src/app.ts";
import { loadConfig } from "../src/config.ts";

test("database initialization is configurable and defaults on locally", () => {
  assert.equal(loadConfig({}).initializeDatabase, true);
  assert.equal(loadConfig({ BOOKCLUB_INITIALIZE_DATABASE: "false" }).initializeDatabase, false);
  assert.equal(loadConfig({ BOOKCLUB_INITIALIZE_DATABASE: "true" }).initializeDatabase, true);
  assert.throws(
    () => loadConfig({ BOOKCLUB_INITIALIZE_DATABASE: "sometimes" }),
    /BOOKCLUB_INITIALIZE_DATABASE must be 'true' or 'false'/,
  );
});

test("the Google Books key is optional configuration", () => {
  assert.equal(loadConfig({}).googleBooksApiKey, null);
  assert.equal(loadConfig({ GOOGLE_BOOKS_API_KEY: "  local-test-key  " }).googleBooksApiKey, "local-test-key");
});

test("health reports availability without exposing club data", async () => {
  const core = openCore(":memory:");
  core.registerWithPassword({ username: "private-member@ohsu.edu", password: "private-password" });
  const app = createApp({ core });

  const response = await app.handle({ method: "GET", path: "/health", headers: {} });

  assert.equal(response.status, 200);
  assert.equal(response.headers["Content-Type"], "application/json; charset=utf-8");
  assert.equal(response.headers["Cache-Control"], "no-store");
  assert.deepEqual(JSON.parse(response.body), { status: "ok" });
  assert.equal(response.body.includes("private-member@ohsu.edu"), false);
  assert.equal(response.body.includes("private-password"), false);
});
