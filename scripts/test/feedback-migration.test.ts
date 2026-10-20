import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { migrateFeedbackDatabase } from "../migrate-feedback.ts";

test("the production feedback migration is additive and idempotent", () => {
  const dir = mkdtempSync(join(tmpdir(), "bookclub-production-migration-"));
  const path = join(dir, "bookclub.sqlite");
  try {
    const legacy = new DatabaseSync(path);
    legacy.exec(`
      CREATE TABLE members (id TEXT PRIMARY KEY);
      INSERT INTO members (id) VALUES ('member-1');
      CREATE TABLE feedback_entries (
        id TEXT PRIMARY KEY,
        member_id TEXT NOT NULL REFERENCES members(id),
        body TEXT NOT NULL,
        submitted_at TEXT NOT NULL
      );
      INSERT INTO feedback_entries (id, member_id, body, submitted_at)
      VALUES ('feedback-1', 'member-1', 'Preserve me', '2026-10-20T12:00:00.000Z');
    `);
    legacy.close();

    assert.deepEqual(migrateFeedbackDatabase(path), {
      members: 1,
      feedbackEntries: 1,
      addedDeletedAt: true,
    });
    assert.deepEqual(migrateFeedbackDatabase(path), {
      members: 1,
      feedbackEntries: 1,
      addedDeletedAt: false,
    });

    const migrated = new DatabaseSync(path);
    assert.deepEqual(
      { ...migrated.prepare("SELECT body, deleted_at FROM feedback_entries").get() },
      { body: "Preserve me", deleted_at: null },
    );
    assert.equal(
      migrated.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'feedback_views'").get()?.name,
      "feedback_views",
    );
    assert.equal((migrated.prepare("PRAGMA integrity_check").get() as { integrity_check: string }).integrity_check, "ok");
    migrated.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
