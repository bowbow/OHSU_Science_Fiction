import assert from "node:assert/strict";
import { test } from "node:test";
import { openCore } from "../src/index.ts";

test("a valid unused username and password creates a signed-in member", () => {
  const core = openCore(":memory:");
  const result = core.registerWithPassword({ username: "Ada@ohsu.edu", password: "Reader12" });
  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  assert.equal(result.member.username, "Ada@ohsu.edu");
  assert.deepEqual(core.currentMember(result.sessionId), result.member);
  assert.equal(JSON.stringify(result).includes("Reader12"), false);
});

test("a taken username is rejected in any letter case and creates nobody", () => {
  const core = openCore(":memory:");
  assert.equal(core.registerWithPassword({ username: "Ada@ohsu.edu", password: "Reader12" }).ok, true);
  const again = core.registerWithPassword({ username: " ada@OHSU.EDU ", password: "Reader99" });
  assert.deepEqual(again, { ok: false, failure: { code: "username_taken" } });
});

test("only OHSU email addresses can register", () => {
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
  for (const username of ["Ada", "ada@gmail.com", "ada@ohsu.edu.example", "ada@@ohsu.edu", "ada smith@ohsu.edu"]) {
    const invalid = core.registerWithPassword({ username, password: "Reader12" });
    assert.equal(invalid.ok, false);
    if (!invalid.ok && invalid.failure.code === "username_invalid") {
      assert.equal(invalid.failure.reason, "not_ohsu_email");
    }
  }
  assert.equal(core.currentMember("none"), null);
});

test("any password string is accepted", () => {
  const core = openCore(":memory:");
  const cases = [
    ["empty1@ohsu.edu", ""],
    ["short1@ohsu.edu", "a"],
    ["words1@ohsu.edu", "abcdefgh"],
    ["same123@ohsu.edu", "Same123"],
    ["long1@ohsu.edu", "x".repeat(200)],
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
  const first = core.registerWithPassword({ username: "Ada@ohsu.edu", password: "Reader12" });
  assert.equal(first.ok, true);
  if (!first.ok) {
    return;
  }
  const second = core.registerWithPassword({
    username: "Bea@ohsu.edu",
    password: "Reader34",
    sessionId: first.sessionId,
  });
  assert.deepEqual(second, { ok: false, failure: { code: "already_signed_in" } });
  assert.equal(core.signInWithPassword({ username: "Bea@ohsu.edu", password: "Reader34" }).ok, false);
});
