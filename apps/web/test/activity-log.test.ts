import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { openCore } from "@bookclub/core";
import { addTestAdmin } from "../../../packages/core/test/support.ts";
import { createActivityLog } from "../src/activity-log.ts";
import { createApp } from "../src/app.ts";

function cookieOf(response: { headers: Record<string, string> }): string {
  return (response.headers["Set-Cookie"] ?? "").split(";")[0] ?? "";
}

test("successful club actions are recorded and refusals are not", async () => {
  const directory = mkdtempSync(join(tmpdir(), "bookclub-activity-"));
  const filePath = join(directory, "activity.log");
  const lines: string[] = [];
  const core = openCore(":memory:");
  addTestAdmin(core);
  const app = createApp({
    core,
    activityLog: createActivityLog(filePath, (line) => {
      lines.push(line);
    }),
  });

  const registered = await app.handle({
    method: "POST",
    path: "/register",
    headers: {},
    body: "username=Ada%40ohsu.edu&password=secret-phrase",
  });
  const cookie = cookieOf(registered);
  await app.handle({ method: "POST", path: "/sign-out", headers: { cookie } });
  const refused = await app.handle({
    method: "POST",
    path: "/sign-in",
    headers: {},
    body: "username=Ada%40ohsu.edu&password=wrong-phrase",
  });
  assert.equal(refused.status, 200);
  const signedIn = await app.handle({
    method: "POST",
    path: "/sign-in",
    headers: {},
    body: "username=Ada%40ohsu.edu&password=secret-phrase",
  });
  const ada = cookieOf(signedIn);

  const adminSignIn = await app.handle({
    method: "POST",
    path: "/sign-in",
    headers: {},
    body: "username=bow&password=admin",
  });
  const bow = cookieOf(adminSignIn);
  await app.handle({ method: "POST", path: "/book-club/open", headers: { cookie: bow } });
  await app.handle({ method: "GET", path: "/book-club", headers: { cookie: ada } });
  await app.handle({ method: "GET", path: "/health", headers: {} });
  await app.handle({
    method: "POST",
    path: "/book-club/suggestions",
    headers: { cookie: bow },
    body: "title=Foundation",
  });
  const club = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: ada } });
  const suggestion = club.body.match(/name="suggestion" value="([^"]+)"/);
  assert.ok(suggestion);
  await app.handle({
    method: "POST",
    path: "/book-club/votes",
    headers: { cookie: ada },
    body: `suggestion=${suggestion[1]}`,
  });
  await app.handle({
    method: "POST",
    path: "/book-club/votes",
    headers: { cookie: ada },
    body: `suggestion=${suggestion[1]}`,
  });

  const text = lines.join("\n");
  assert.match(text, /Ada@ohsu\.edu registered/);
  assert.match(text, /Ada@ohsu\.edu signed out/);
  assert.match(text, /Ada@ohsu\.edu signed in/);
  assert.match(text, /bow signed in/);
  assert.match(text, /bow opened the club for book suggestions/);
  assert.match(text, /bow suggested "Foundation"/);
  assert.match(text, /Ada@ohsu\.edu voted for "Foundation"/);
  assert.equal(text.includes("moved their vote"), false);
  assert.equal(text.includes("secret-phrase"), false);
  assert.equal(text.includes("wrong-phrase"), false);
  assert.equal(text.includes("signed in"), true);
  const voted = lines.filter((line) => line.includes('voted for "Foundation"'));
  assert.equal(voted.length, 1);
  assert.equal(readFileSync(filePath, "utf8"), `${lines.join("\n")}\n`);
  rmSync(directory, { recursive: true, force: true });
});
