import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  username_normalized TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('regular', 'admin')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members(id),
  created_at TEXT NOT NULL,
  ended_at TEXT
);

CREATE TABLE IF NOT EXISTS book_clubs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('open_for_suggestions', 'suggestions_closed')),
  opened_at TEXT NOT NULL,
  closed_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS one_open_book_club
  ON book_clubs(status) WHERE status = 'open_for_suggestions';

CREATE TABLE IF NOT EXISTS book_suggestions (
  id TEXT PRIMARY KEY,
  book_club_id TEXT NOT NULL REFERENCES book_clubs(id),
  title TEXT NOT NULL,
  title_normalized TEXT NOT NULL,
  suggested_by TEXT NOT NULL REFERENCES members(id),
  suggested_at TEXT NOT NULL,
  cover_id INTEGER,
  cover_checked INTEGER NOT NULL DEFAULT 0,
  UNIQUE (book_club_id, title_normalized)
);

CREATE TABLE IF NOT EXISTS book_votes (
  id TEXT PRIMARY KEY,
  suggestion_id TEXT NOT NULL REFERENCES book_suggestions(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members(id),
  voted_at TEXT NOT NULL,
  UNIQUE (member_id)
);

CREATE TABLE IF NOT EXISTS meeting_times (
  id TEXT PRIMARY KEY,
  book_club_id TEXT NOT NULL REFERENCES book_clubs(id),
  starts_at TEXT NOT NULL,
  proposed_at TEXT NOT NULL,
  UNIQUE (book_club_id, starts_at)
);

CREATE TABLE IF NOT EXISTS meeting_votes (
  id TEXT PRIMARY KEY,
  meeting_time_id TEXT NOT NULL REFERENCES meeting_times(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members(id),
  voted_at TEXT NOT NULL,
  UNIQUE (meeting_time_id, member_id)
);
`;

export function openDatabase(path: string): DatabaseSync {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  ensureRoleColumn(db);
  ensureCoverColumns(db);
  ensureSelectedSuggestionColumn(db);
  ensureSelectedMeetingColumn(db);
  return db;
}

function ensureCoverColumns(db: DatabaseSync): void {
  const columns = db.prepare("PRAGMA table_info(book_suggestions)").all() as { name: string }[];
  if (columns.length === 0) {
    return;
  }
  if (!columns.some((column) => column.name === "cover_id")) {
    db.exec("ALTER TABLE book_suggestions ADD COLUMN cover_id INTEGER");
  }
  if (!columns.some((column) => column.name === "cover_checked")) {
    db.exec("ALTER TABLE book_suggestions ADD COLUMN cover_checked INTEGER NOT NULL DEFAULT 0");
  }
}

function ensureSelectedSuggestionColumn(db: DatabaseSync): void {
  const columns = db.prepare("PRAGMA table_info(book_clubs)").all() as { name: string }[];
  if (columns.length > 0 && !columns.some((column) => column.name === "selected_suggestion_id")) {
    db.exec("ALTER TABLE book_clubs ADD COLUMN selected_suggestion_id TEXT REFERENCES book_suggestions(id)");
  }
}

function ensureSelectedMeetingColumn(db: DatabaseSync): void {
  const columns = db.prepare("PRAGMA table_info(book_clubs)").all() as { name: string }[];
  if (columns.length > 0 && !columns.some((column) => column.name === "selected_meeting_time_id")) {
    db.exec("ALTER TABLE book_clubs ADD COLUMN selected_meeting_time_id TEXT REFERENCES meeting_times(id)");
  }
}

function ensureRoleColumn(db: DatabaseSync): void {
  const columns = db.prepare("PRAGMA table_info(members)").all() as { name: string }[];
  if (columns.length > 0 && !columns.some((column) => column.name === "role")) {
    db.exec("ALTER TABLE members ADD COLUMN role TEXT NOT NULL DEFAULT 'regular'");
  }
}
