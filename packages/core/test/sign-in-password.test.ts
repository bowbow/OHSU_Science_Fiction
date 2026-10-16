import assert from "node:assert/strict";
import { test } from "node:test";
import { openCore } from "../src/index.ts";

function seedPasswordMember() {
  const core = openCore(":memory:");
  const created = core.registerWithPassword({ username: "Ada", password: "Reader12" });
  assert.equal(created.ok, true);
  if (!created.ok) {
    throw new Error("seed failed");
  }
  core.signOut(created.sessionId);
  return core;
}

test("a signed-out password member can sign in with any letter case", () => {
  const core = seedPasswordMember();
  const signedIn = core.signInWithPassword({ username: " aDa ", password: "Reader12" });
  assert.equal(signedIn.ok, true);
  if (!signedIn.ok) {
    return;
  }
  assert.equal(signedIn.member.username, "Ada");
  assert.equal(core.currentMember(signedIn.sessionId)?.id, signedIn.member.id);
});

test("unknown username and wrong password return the same failure", () => {
  const core = seedPasswordMember();
  const unknown = core.signInWithPassword({ username: "Nobody", password: "Reader12" });
  const wrong = core.signInWithPassword({ username: "Ada", password: "Wrong123" });
  assert.deepEqual(unknown, { ok: false, failure: { code: "invalid_credentials" } });
  assert.deepEqual(wrong, { ok: false, failure: { code: "invalid_credentials" } });
});

test("sign-out ends the session and the member must sign in again", () => {
  const core = seedPasswordMember();
  const signedIn = core.signInWithPassword({ username: "Ada", password: "Reader12" });
  assert.equal(signedIn.ok, true);
  if (!signedIn.ok) {
    return;
  }
  core.signOut(signedIn.sessionId);
  assert.equal(core.currentMember(signedIn.sessionId), null);
});

test("a session stays open when its start time is in the past", () => {
  const core = seedPasswordMember();
  const signedIn = core.signInWithPassword({ username: "Ada", password: "Reader12" });
  assert.equal(signedIn.ok, true);
  if (!signedIn.ok) {
    return;
  }
  core.db.prepare("UPDATE sessions SET created_at = ? WHERE id = ?").run(
    "2000-01-01T00:00:00.000Z",
    signedIn.sessionId,
  );
  const row = core.db.prepare("SELECT ended_at FROM sessions WHERE id = ?").get(signedIn.sessionId) as {
    ended_at: string | null;
  };
  assert.equal(row.ended_at, null);
  assert.equal(core.currentMember(signedIn.sessionId)?.username, "Ada");
});

test("repeated wrong attempts stay immediate and do not lock the member", () => {
  const core = seedPasswordMember();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = core.signInWithPassword({ username: "Ada", password: "Wrong123" });
    assert.deepEqual(result, { ok: false, failure: { code: "invalid_credentials" } });
  }
  const schema = core.db.prepare("SELECT sql FROM sqlite_master WHERE name = 'sessions' OR name = 'members'").all() as Array<{
    sql: string;
  }>;
  const combined = schema.map((entry) => entry.sql).join("\n");
  assert.equal(/fail|lock|expir/i.test(combined), false);
  assert.equal(core.signInWithPassword({ username: "Ada", password: "Reader12" }).ok, true);
});
