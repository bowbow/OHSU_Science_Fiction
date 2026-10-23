import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { migrateBookDetailsDatabase } from "../migrate-book-details.ts";

const EXPECTED_COLUMNS = [
  "google_books_id",
  "book_authors",
  "book_summary",
  "book_categories",
  "book_info_url",
  "book_thumbnail_url",
  "book_details_checked",
];

test("the production book-details migration is additive and idempotent", () => {
  const dir = mkdtempSync(join(tmpdir(), "bookclub-book-details-migration-"));
  const path = join(dir, "bookclub.sqlite");
  try {
    const legacy = new DatabaseSync(path);
    legacy.exec(`
      CREATE TABLE members (id TEXT PRIMARY KEY);
      INSERT INTO members (id) VALUES ('member-1');
      CREATE TABLE book_suggestions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        suggested_by TEXT NOT NULL REFERENCES members(id),
        cover_id INTEGER,
        cover_checked INTEGER NOT NULL DEFAULT 0
      );
      INSERT INTO book_suggestions (id, title, suggested_by, cover_id, cover_checked)
      VALUES ('suggestion-1', 'Dune', 'member-1', 42, 1);
    `);
    legacy.close();

    assert.deepEqual(migrateBookDetailsDatabase(path), {
      members: 1,
      suggestions: 1,
      addedColumns: EXPECTED_COLUMNS,
    });
    assert.deepEqual(migrateBookDetailsDatabase(path), {
      members: 1,
      suggestions: 1,
      addedColumns: [],
    });

    const migrated = new DatabaseSync(path);
    assert.deepEqual(
      { ...migrated.prepare("SELECT title, cover_id, book_details_checked FROM book_suggestions").get() },
      { title: "Dune", cover_id: 42, book_details_checked: 0 },
    );
    const columns = (migrated.prepare("PRAGMA table_info(book_suggestions)").all() as { name: string }[])
      .map((column) => column.name);
    for (const column of EXPECTED_COLUMNS) assert.ok(columns.includes(column), `missing ${column}`);
    assert.equal((migrated.prepare("PRAGMA integrity_check").get() as { integrity_check: string }).integrity_check, "ok");
    migrated.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
