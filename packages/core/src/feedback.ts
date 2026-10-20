import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { actionFailure, type ActionResult } from "./errors.ts";
import { currentMember } from "./session.ts";

export const MAX_FEEDBACK_WORDS = 1_000;

export type FeedbackView = {
  id: string;
  memberId: string;
  username: string;
  text: string;
  submittedAt: string;
  seen: boolean;
  seenAt: string | null;
};

export function feedbackWordCount(text: string): number {
  const cleaned = text.trim();
  return cleaned === "" ? 0 : cleaned.split(/\s+/u).length;
}

export function submitFeedback(
  db: DatabaseSync,
  input: { sessionId: string | null | undefined; text: string },
): ActionResult<{ id: string; submittedAt: string }> {
  const member = currentMember(db, input.sessionId);
  if (!member) {
    return actionFailure({ code: "not_signed_in" });
  }

  const text = input.text.trim();
  const words = feedbackWordCount(text);
  if (words === 0) {
    return actionFailure({ code: "feedback_empty" });
  }
  if (words > MAX_FEEDBACK_WORDS) {
    return actionFailure({ code: "feedback_too_long" });
  }

  const id = randomUUID();
  const submittedAt = new Date().toISOString();
  db.prepare(
    "INSERT INTO feedback_entries (id, member_id, body, submitted_at) VALUES (?, ?, ?, ?)",
  ).run(id, member.id, text, submittedAt);
  return { ok: true, value: { id, submittedAt } };
}

export function feedbackForAdmin(
  db: DatabaseSync,
  sessionId: string | null | undefined,
): ActionResult<FeedbackView[]> {
  const member = currentMember(db, sessionId);
  if (!member) {
    return actionFailure({ code: "not_signed_in" });
  }
  if (member.role !== "admin") {
    return actionFailure({ code: "not_an_admin" });
  }

  const rows = db.prepare(
    `SELECT f.id, f.member_id, m.username, f.body, f.submitted_at, v.seen_at
     FROM feedback_entries f
     JOIN members m ON m.id = f.member_id
     LEFT JOIN feedback_views v
       ON v.feedback_id = f.id AND v.admin_member_id = ?
     WHERE f.deleted_at IS NULL
     ORDER BY f.submitted_at DESC, f.rowid DESC`,
  ).all(member.id) as {
    id: string;
    member_id: string;
    username: string;
    body: string;
    submitted_at: string;
    seen_at: string | null;
  }[];

  return {
    ok: true,
    value: rows.map((row) => ({
      id: row.id,
      memberId: row.member_id,
      username: row.username,
      text: row.body,
      submittedAt: row.submitted_at,
      seen: row.seen_at !== null,
      seenAt: row.seen_at,
    })),
  };
}

export function markFeedbackSeen(
  db: DatabaseSync,
  input: { sessionId: string | null | undefined; feedbackId: string },
): ActionResult<{ feedbackId: string }> {
  const member = currentMember(db, input.sessionId);
  if (!member) {
    return actionFailure({ code: "not_signed_in" });
  }
  if (member.role !== "admin") {
    return actionFailure({ code: "not_an_admin" });
  }

  const feedback = db.prepare("SELECT id FROM feedback_entries WHERE id = ? AND deleted_at IS NULL").get(input.feedbackId) as
    | { id: string }
    | undefined;
  if (!feedback) {
    return actionFailure({ code: "feedback_not_found" });
  }

  db.prepare(
    `INSERT INTO feedback_views (feedback_id, admin_member_id, seen_at)
     VALUES (?, ?, ?)
     ON CONFLICT (feedback_id, admin_member_id) DO NOTHING`,
  ).run(input.feedbackId, member.id, new Date().toISOString());
  return { ok: true, value: { feedbackId: input.feedbackId } };
}

export function deleteFeedback(
  db: DatabaseSync,
  input: { sessionId: string | null | undefined; feedbackIds: string[] },
): ActionResult<{ deleted: number }> {
  const member = currentMember(db, input.sessionId);
  if (!member) {
    return actionFailure({ code: "not_signed_in" });
  }
  if (member.role !== "admin") {
    return actionFailure({ code: "not_an_admin" });
  }

  const feedbackIds = [...new Set(input.feedbackIds.filter(Boolean))];
  if (feedbackIds.length === 0) {
    return actionFailure({ code: "feedback_none_selected" });
  }

  const statement = db.prepare(
    "UPDATE feedback_entries SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL",
  );
  let deleted = 0;
  const deletedAt = new Date().toISOString();
  db.exec("BEGIN");
  try {
    for (const feedbackId of feedbackIds) {
      deleted += Number(statement.run(deletedAt, feedbackId).changes);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return { ok: true, value: { deleted } };
}
