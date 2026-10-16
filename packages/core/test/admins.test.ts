import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { openCore } from "../src/index.ts";

test("bow starts as an admin and registration stays regular", () => {
  const core = openCore(":memory:");
  const bow = core.signInWithPassword({ username: "Bow", password: "admin" });
  assert.equal(bow.ok, true);
  if (!bow.ok) {
    return;
  }
  assert.equal(bow.member.username, "bow");
  assert.equal(bow.member.role, "admin");
  assert.equal(JSON.stringify(bow).includes("password_hash"), false);
  assert.equal(core.currentMember(bow.sessionId)?.role, "admin");

  assert.deepEqual(core.registerWithPassword({ username: "bow", password: "other" }), {
    ok: false,
    failure: { code: "username_taken" },
  });

  const registered = core.registerWithPassword({ username: "Ada", password: "admin" });
  assert.equal(registered.ok, true);
  if (!registered.ok) {
    return;
  }
  assert.equal(registered.member.role, "regular");
});

test("starting again does not duplicate the admin or change its password", () => {
  const dir = mkdtempSync(join(tmpdir(), "bookclub-admins-"));
  const path = join(dir, "club.sqlite");
  try {
    const first = openCore(path);
    const before = first.db.prepare(
      "SELECT password_hash FROM members WHERE username_normalized = ?",
    ).get("bow") as { password_hash: string };
    first.db.close();

    const second = openCore(path);
    const rows = second.db.prepare(
      "SELECT username, role, password_hash FROM members WHERE username_normalized = 'bow' ORDER BY username",
    ).all() as { username: string; role: string; password_hash: string }[];
    assert.deepEqual(
      rows.map((row) => ({ username: row.username, role: row.role })),
      [
        { username: "bow", role: "admin" },
      ],
    );
    assert.equal(rows[0]?.password_hash, before.password_hash);
    assert.equal(second.signInWithPassword({ username: "bow", password: "admin" }).ok, true);
    second.db.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("an older member table gains roles and the seeded admins", () => {
  const dir = mkdtempSync(join(tmpdir(), "bookclub-migrate-"));
  const path = join(dir, "club.sqlite");
  try {
    const db = new DatabaseSync(path);
    db.exec(`
      CREATE TABLE members (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        username_normalized TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    db.close();

    const core = openCore(path);
    const ada = core.registerWithPassword({ username: "Ada", password: "secret" });
    assert.equal(ada.ok, true);
    if (!ada.ok) {
      return;
    }
    assert.equal(ada.member.role, "regular");
    const bow = core.signInWithPassword({ username: "bow", password: "admin" });
    assert.equal(bow.ok, true);
    if (!bow.ok) {
      return;
    }
    assert.equal(bow.member.role, "admin");
    core.db.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
