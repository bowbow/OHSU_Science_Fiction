import { existsSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";

export type FeedbackMigrationResult = {
  members: number;
  feedbackEntries: number;
  addedDeletedAt: boolean;
};

export function migrateFeedbackDatabase(path: string): FeedbackMigrationResult {
  if (!existsSync(path) || statSync(path).size === 0) {
    throw new Error(`BookClub database does not exist or is empty: ${path}`);
  }

  const db = new DatabaseSync(path);
  try {
    db.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 10000;");
    if (!tableExists(db, "members")) {
      throw new Error("BookClub members table is missing; refusing to migrate.");
    }

    const membersBefore = rowCount(db, "members");
    const feedbackBefore = tableExists(db, "feedback_entries") ? rowCount(db, "feedback_entries") : 0;
    let addedDeletedAt = false;

    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS feedback_entries (
          id TEXT PRIMARY KEY,
          member_id TEXT NOT NULL REFERENCES members(id),
          body TEXT NOT NULL CHECK (length(trim(body)) > 0),
          submitted_at TEXT NOT NULL,
          deleted_at TEXT
        );
      `);

      const columns = db.prepare("PRAGMA table_info(feedback_entries)").all() as { name: string }[];
      if (!columns.some((column) => column.name === "deleted_at")) {
        db.exec("ALTER TABLE feedback_entries ADD COLUMN deleted_at TEXT");
        addedDeletedAt = true;
      }

      db.exec(`
        CREATE INDEX IF NOT EXISTS feedback_entries_newest
          ON feedback_entries(submitted_at DESC);

        CREATE TABLE IF NOT EXISTS feedback_views (
          feedback_id TEXT NOT NULL REFERENCES feedback_entries(id) ON DELETE CASCADE,
          admin_member_id TEXT NOT NULL REFERENCES members(id),
          seen_at TEXT NOT NULL,
          PRIMARY KEY (feedback_id, admin_member_id)
        );
      `);

      const membersAfter = rowCount(db, "members");
      const feedbackAfter = rowCount(db, "feedback_entries");
      if (membersAfter !== membersBefore) {
        throw new Error(`Member count changed during migration (${membersBefore} to ${membersAfter}).`);
      }
      if (feedbackAfter !== feedbackBefore) {
        throw new Error(`Feedback count changed during migration (${feedbackBefore} to ${feedbackAfter}).`);
      }

      const integrity = db.prepare("PRAGMA integrity_check").get() as { integrity_check: string };
      if (integrity.integrity_check !== "ok") {
        throw new Error(`SQLite integrity check failed: ${integrity.integrity_check}`);
      }

      db.exec("COMMIT");
      return { members: membersAfter, feedbackEntries: feedbackAfter, addedDeletedAt };
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

function rowCount(db: DatabaseSync, table: "members" | "feedback_entries"): number {
  return Number((db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number }).count);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const databasePath = process.argv[2] ?? process.env.BOOKCLUB_SQLITE_PATH;
  if (!databasePath) {
    console.error("usage: migrate-feedback.ts <database-path>");
    process.exitCode = 64;
  } else {
    try {
      const result = migrateFeedbackDatabase(databasePath);
      console.log(`Feedback migration complete: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  }
}
