import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { createVerifiedBackup, verifySqliteDatabase } from "../sqlite-backup.ts";

test("a verified backup is a restorable snapshot of the SQLite database", async () => {
  const directory = mkdtempSync(join(tmpdir(), "bookclub-backup-test-"));
  const sourcePath = join(directory, "source.sqlite");
  const backupDirectory = join(directory, "backups");

  try {
    const source = new DatabaseSync(sourcePath);
    source.exec("CREATE TABLE members (username TEXT PRIMARY KEY, role TEXT NOT NULL)");
    source.prepare("INSERT INTO members (username, role) VALUES (?, ?)").run("reader", "regular");
    source.close();

    const backupPath = await createVerifiedBackup(sourcePath, backupDirectory);
    verifySqliteDatabase(backupPath);

    const restored = new DatabaseSync(backupPath, { readOnly: true });
    const member = restored.prepare("SELECT username, role FROM members").get();
    restored.close();
    assert.equal((member as { username: string }).username, "reader");
    assert.equal((member as { role: string }).role, "regular");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
