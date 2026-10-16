import assert from "node:assert/strict";
import { test } from "node:test";
import { openCore } from "@bookclub/core";
import { createApp } from "../src/app.ts";

test("the session cookie remains until sign-out", async () => {
  const app = createApp({
    core: openCore(":memory:"),
  });
  const registered = await app.handle({
    method: "POST",
    path: "/register",
    headers: {},
    body: "username=Ada&password=Reader12",
  });
  const setCookie = registered.headers["Set-Cookie"];
  assert.match(setCookie ?? "", /bookclub_session=/);
  assert.match(setCookie ?? "", /Max-Age=/);
  assert.match(setCookie ?? "", /HttpOnly/);
  const cookie = setCookie!.split(";")[0];

  const account = await app.handle({ method: "GET", path: "/account", headers: { cookie } });
  assert.match(account.body, /Ada/);
  assert.match(account.headers["Set-Cookie"] ?? "", /Max-Age=/);

  const signedOut = await app.handle({ method: "POST", path: "/sign-out", headers: { cookie } });
  assert.equal(signedOut.status, 303);
  const after = await app.handle({ method: "GET", path: "/account", headers: { cookie } });
  assert.match(after.body, /signed out/i);
  assert.equal(after.body.includes(">Ada<") || after.body.includes("as Ada"), false);
});
