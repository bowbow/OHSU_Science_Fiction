import { randomBytes } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { toMemberView, type MemberRole, type MemberView } from "./member-view.ts";

type SessionJoinRow = {
  ended_at: string | null;
  id: string;
  username: string;
  role: MemberRole;
};

export function createSession(db: DatabaseSync, memberId: string): string {
  const id = randomBytes(32).toString("base64url");
  db.prepare(
    "INSERT INTO sessions (id, member_id, created_at, ended_at) VALUES (?, ?, ?, NULL)",
  ).run(id, memberId, new Date().toISOString());
  return id;
}

export function endSession(db: DatabaseSync, sessionId: string): void {
  db.prepare(
    "UPDATE sessions SET ended_at = ? WHERE id = ? AND ended_at IS NULL",
  ).run(new Date().toISOString(), sessionId);
}

export function currentMember(db: DatabaseSync, sessionId: string | null | undefined): MemberView | null {
  if (!sessionId) {
    return null;
  }
  const row = db.prepare(
    `SELECT s.ended_at, m.id, m.username, m.role
     FROM sessions s
     JOIN members m ON m.id = s.member_id
     WHERE s.id = ?`,
  ).get(sessionId) as SessionJoinRow | undefined;
  if (!row || row.ended_at !== null) {
    return null;
  }
  return toMemberView(row);
}
