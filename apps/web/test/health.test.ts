import assert from "node:assert/strict";
import { test } from "node:test";
import { openCore } from "@bookclub/core";
import { createApp } from "../src/app.ts";

test("health reports availability without exposing club data", async () => {
  const core = openCore(":memory:");
  core.registerWithPassword({ username: "private-member", password: "private-password" });
  const app = createApp({ core });

  const response = await app.handle({ method: "GET", path: "/health", headers: {} });

  assert.equal(response.status, 200);
  assert.equal(response.headers["Content-Type"], "application/json; charset=utf-8");
  assert.equal(response.headers["Cache-Control"], "no-store");
  assert.deepEqual(JSON.parse(response.body), { status: "ok" });
  assert.equal(response.body.includes("private-member"), false);
  assert.equal(response.body.includes("private-password"), false);
});
