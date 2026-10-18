import assert from "node:assert/strict";
import { test } from "node:test";
import { openCore } from "@bookclub/core";
import { addTestAdmin } from "../../../packages/core/test/support.ts";
import { createApp } from "../src/app.ts";

test("an admin account page names the admin and a registration stays regular", async () => {
  const core = openCore(":memory:");
  addTestAdmin(core);
  const app = createApp({ core });
  const signedIn = await app.handle({
    method: "POST",
    path: "/sign-in",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "username=bow&password=admin",
  });
  const cookie = signedIn.headers["Set-Cookie"];
  assert.ok(cookie);
  assert.equal(cookie.includes("admin"), false);

  const account = await app.handle({
    method: "GET",
    path: "/account",
    headers: { cookie: cookie.split(";")[0] },
  });
  assert.match(account.body, /class="signed-in-name">bow</);
  assert.match(account.body, /class="member-role">Admin</);
  assert.match(account.body, /You are an admin/);
  assert.match(account.body, /href="\/account"/);
  assert.match(account.body, /href="\/book-club"/);
  assert.equal(account.body.includes("password"), false);
});
