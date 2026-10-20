import assert from "node:assert/strict";
import { test } from "node:test";
import { openCore } from "@bookclub/core";
import { createApp } from "../src/app.ts";

test("the register form hides the password and does not show it after submit", async () => {
  const app = createApp({
    core: openCore(":memory:"),
  });
  const page = await app.handle({ method: "GET", path: "/register", headers: {} });
  assert.match(page.body, /<title>Register · OHSU Science Fiction Bookclub<\/title>/);
  assert.match(page.body, /<html lang="en" data-variant="scifi">/);
  assert.match(page.body, /<p class="mark">[\s\S]*OHSU SF Bookclub<\/p>/);
  assert.match(page.body, /<header class="banner"><h1>OHSU Science Fiction Bookclub<\/h1><\/header>/);
  assert.match(page.body, /requestedVariant === "scifi" \|\| requestedVariant === "classic"/);
  assert.match(page.body, /sessionStorage\.setItem\("site-variant", requestedVariant\)/);
  assert.match(page.body, /sessionStorage\.getItem\("site-variant"\) \|\| "scifi"/);
  assert.match(page.body, /selectedVariant === "classic"[^\n]*delete document\.documentElement\.dataset\.variant/);
  assert.match(page.body, /html\[data-variant="scifi"\]/);
  assert.equal(page.body.includes('class="signed-in-name"'), false);
  assert.match(page.body, /<aside>[\s\S]*href="\/register" aria-current="page"[\s\S]*Sign in[\s\S]*<\/aside>/);
  assert.equal(/gmail|accounts\.google|sign in with google/i.test(page.body), false);
  assert.match(page.body, /type="password"/);
  assert.equal(page.body.includes("name=\"password\" type=\"text\""), false);

  const submitted = await app.handle({
    method: "POST",
    path: "/register",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "username=Ada&password=Reader12",
  });
  assert.equal(submitted.body.includes("Reader12"), false);
  assert.equal(submitted.headers["Set-Cookie"]?.includes("Reader12"), false);

  const cookie = submitted.headers["Set-Cookie"];
  assert.ok(cookie);
  const account = await app.handle({
    method: "GET",
    path: "/account",
    headers: { cookie: cookie.split(";")[0] },
  });
  assert.equal(account.body.includes("Reader12"), false);
  assert.match(account.body, /class="signed-in-name">Ada</);
  assert.equal(account.body.includes('class="member-role"'), false);
  assert.match(account.body, /<aside>[\s\S]*Ada[\s\S]*Sign out[\s\S]*<\/aside>/);
  assert.equal(account.body.includes('href="/book-club"'), false);
  assert.equal(account.body.includes('href="/account"'), false);
  assert.match(account.body, /<main>[\s\S]*OHSU Science Fiction Bookclub[\s\S]*You are signed in as Ada[\s\S]*You are a regular member/);

  const google = await app.handle({ method: "POST", path: "/register/google", headers: {}, body: "" });
  assert.equal(google.status, 404);
});
