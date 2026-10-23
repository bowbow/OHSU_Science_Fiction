import { existsSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";

const COLUMNS = [
  ["open_library_edition_key", "TEXT"],
  ["open_library_work_key", "TEXT"],
  ["open_library_isbns", "TEXT"],
  ["google_books_id", "TEXT"],
  ["book_authors", "TEXT"],
  ["book_summary", "TEXT"],
  ["book_categories", "TEXT"],
  ["book_info_url", "TEXT"],
  ["book_thumbnail_url", "TEXT"],
  ["book_details_checked", "INTEGER NOT NULL DEFAULT 0"],
] as const;

export type BookDetailsMigrationResult = {
  members: number;
  suggestions: number;
  addedColumns: string[];
};

export function migrateBookDetailsDatabase(path: string): BookDetailsMigrationResult {
  if (!existsSync(path) || statSync(path).size === 0) {
    throw new Error(`BookClub database does not exist or is empty: ${path}`);
  }

  const db = new DatabaseSync(path);
  try {
    db.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 10000;");
    if (!tableExists(db, "members") || !tableExists(db, "book_suggestions")) {
      throw new Error("BookClub members or book_suggestions table is missing; refusing to migrate.");
    }
    const membersBefore = rowCount(db, "members");
    const suggestionsBefore = rowCount(db, "book_suggestions");
    const addedColumns: string[] = [];

    db.exec("BEGIN IMMEDIATE");
    try {
      const existing = new Set(
        (db.prepare("PRAGMA table_info(book_suggestions)").all() as { name: string }[])
          .map((column) => column.name),
      );
      for (const [name, definition] of COLUMNS) {
        if (!existing.has(name)) {
          db.exec(`ALTER TABLE book_suggestions ADD COLUMN ${name} ${definition}`);
          addedColumns.push(name);
        }
      }

      const membersAfter = rowCount(db, "members");
      const suggestionsAfter = rowCount(db, "book_suggestions");
      if (membersAfter !== membersBefore) {
        throw new Error(`Member count changed during migration (${membersBefore} to ${membersAfter}).`);
      }
      if (suggestionsAfter !== suggestionsBefore) {
        throw new Error(`Suggestion count changed during migration (${suggestionsBefore} to ${suggestionsAfter}).`);
      }
      const integrity = db.prepare("PRAGMA integrity_check").get() as { integrity_check: string };
      if (integrity.integrity_check !== "ok") {
        throw new Error(`SQLite integrity check failed: ${integrity.integrity_check}`);
      }

      db.exec("COMMIT");
      return { members: membersAfter, suggestions: suggestionsAfter, addedColumns };
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  } finally {
    db.close();
  }
}

function tableExists(db: DatabaseSync, name: string): boolean {
  return db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name) !== undefined;
}

function rowCount(db: DatabaseSync, table: "members" | "book_suggestions"): number {
  return Number((db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number }).count);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const databasePath = process.argv[2] ?? process.env.BOOKCLUB_SQLITE_PATH;
  if (!databasePath) {
    console.error("usage: migrate-book-details.ts <database-path>");
    process.exitCode = 64;
  } else {
    try {
      const result = migrateBookDetailsDatabase(databasePath);
      console.log(`Book details migration complete: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  }
}
