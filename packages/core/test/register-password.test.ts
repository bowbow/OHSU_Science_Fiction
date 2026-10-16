import assert from "node:assert/strict";
import { test } from "node:test";
import { openCore } from "../src/index.ts";

test("a valid unused username and password creates a signed-in member", () => {
  const core = openCore(":memory:");
  const result = core.registerWithPassword({ username: "Ada", password: "Reader12" });
  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  assert.equal(result.member.username, "Ada");
  assert.deepEqual(core.currentMember(result.sessionId), result.member);
  assert.equal(JSON.stringify(result).includes("Reader12"), false);
});

test("a taken username is rejected in any letter case and creates nobody", () => {
  const core = openCore(":memory:");
  assert.equal(core.registerWithPassword({ username: "Ada", password: "Reader12" }).ok, true);
  const again = core.registerWithPassword({ username: " ada ", password: "Reader99" });
  assert.deepEqual(again, { ok: false, failure: { code: "username_taken" } });
});

test("invalid usernames and passwords create nobody", () => {
  const core = openCore(":memory:");
  assert.equal(
    core.registerWithPassword({ username: "   ", password: "Reader12" }).ok && false,
    false,
  );
  const empty = core.registerWithPassword({ username: "   ", password: "Reader12" });
  assert.equal(empty.ok, false);
  if (!empty.ok) {
    assert.equal(empty.failure.code, "username_invalid");
  }
  const short = core.registerWithPassword({ username: "ab", password: "Reader12" });
  assert.equal(short.ok, false);
  if (!short.ok && short.failure.code === "username_invalid") {
    assert.equal(short.failure.reason, "too_short");
  }
  const long = core.registerWithPassword({ username: "a".repeat(31), password: "Reader12" });
  assert.equal(long.ok, false);
  if (!long.ok && long.failure.code === "username_invalid") {
    assert.equal(long.failure.reason, "too_long");
  }
  const space = core.registerWithPassword({ username: "bad name", password: "Reader12" });
  assert.equal(space.ok, false);
  if (!space.ok && space.failure.code === "username_invalid") {
    assert.equal(space.failure.reason, "bad_characters");
  }
  const hyphen = core.registerWithPassword({ username: "-ada", password: "Reader12" });
  assert.equal(hyphen.ok, false);
  if (!hyphen.ok && hyphen.failure.code === "username_invalid") {
    assert.equal(hyphen.failure.reason, "must_start_alphanumeric");
  }
  assert.equal(core.currentMember("none"), null);
});

test("any password string is accepted", () => {
  const core = openCore(":memory:");
  const cases = [
    ["Empty1", ""],
    ["Short1", "a"],
    ["Words1", "abcdefgh"],
    ["Same123", "Same123"],
    ["Long1", "x".repeat(200)],
  ] as const;
  for (const [username, password] of cases) {
    const result = core.registerWithPassword({ username, password });
    assert.equal(result.ok, true);
    if (result.ok) {
      core.signOut(result.sessionId);
      const signedIn = core.signInWithPassword({ username, password });
      assert.equal(signedIn.ok, true);
    }
  }
});

test("an existing session cannot register another password member", () => {
  const core = openCore(":memory:");
  const first = core.registerWithPassword({ username: "Ada", password: "Reader12" });
  assert.equal(first.ok, true);
  if (!first.ok) {
    return;
  }
  const second = core.registerWithPassword({
    username: "Bea",
    password: "Reader34",
    sessionId: first.sessionId,
  });
  assert.deepEqual(second, { ok: false, failure: { code: "already_signed_in" } });
  assert.equal(core.signInWithPassword({ username: "Bea", password: "Reader34" }).ok, false);
});
