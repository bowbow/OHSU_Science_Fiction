import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { openCore } from "../src/index.ts";
import { addTestAdmin } from "./support.ts";

test("startup does not create an administrator", () => {
  const core = openCore(":memory:");
  assert.equal(core.db.prepare("SELECT COUNT(*) AS count FROM members").get()?.count, 0);
  assert.deepEqual(core.signInWithPassword({ username: "bow", password: "admin" }), {
    ok: false,
    failure: { code: "invalid_credentials" },
  });

  const registered = core.registerWithPassword({ username: "Ada", password: "admin" });
  assert.equal(registered.ok, true);
  if (registered.ok) {
    assert.equal(registered.member.role, "regular");
  }
});

test("an explicitly assigned administrator keeps that role after restart", () => {
  const dir = mkdtempSync(join(tmpdir(), "bookclub-admins-"));
  const path = join(dir, "club.sqlite");
  try {
    const first = openCore(path);
    addTestAdmin(first);
    first.db.close();

    const second = openCore(path, { initializeDatabase: false });
    const signedIn = second.signInWithPassword({ username: "bow", password: "admin" });
    assert.equal(signedIn.ok, true);
    if (signedIn.ok) {
      assert.equal(signedIn.member.role, "admin");
    }
    assert.equal(second.db.prepare("SELECT COUNT(*) AS count FROM members").get()?.count, 1);
    second.db.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("database initialization can be disabled", () => {
  const dir = mkdtempSync(join(tmpdir(), "bookclub-no-init-"));
  const missingPath = join(dir, "missing.sqlite");
  const emptyPath = join(dir, "empty.sqlite");
  try {
    assert.throws(
      () => openCore(missingPath, { initializeDatabase: false }),
      /Database initialization is disabled and the database does not exist/,
    );
    assert.equal(existsSync(missingPath), false);

    new DatabaseSync(emptyPath).close();
    const core = openCore(emptyPath, { initializeDatabase: false });
    const tables = core.db.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    ).all();
    assert.deepEqual(tables, []);
    core.db.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("disabled initialization leaves an existing database file unchanged", () => {
  const dir = mkdtempSync(join(tmpdir(), "bookclub-unchanged-"));
  const path = join(dir, "club.sqlite");
  try {
    const initialized = openCore(path);
    initialized.registerWithPassword({ username: "Ada", password: "secret" });
    initialized.db.close();
    const before = readFileSync(path);

    const reopened = openCore(path, { initializeDatabase: false });
    reopened.db.close();

    assert.deepEqual(readFileSync(path), before);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("an older member table gains roles only when initialization is enabled", () => {
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

    const noInitialization = openCore(path, { initializeDatabase: false });
    const before = noInitialization.db.prepare("PRAGMA table_info(members)").all() as { name: string }[];
    assert.equal(before.some((column) => column.name === "role"), false);
    noInitialization.db.close();

    const initialized = openCore(path);
    const after = initialized.db.prepare("PRAGMA table_info(members)").all() as { name: string }[];
    assert.equal(after.some((column) => column.name === "role"), true);
    assert.equal(initialized.db.prepare("SELECT COUNT(*) AS count FROM members").get()?.count, 0);
    initialized.db.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
