import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { actionFailure, isUniqueConstraint, type ActionResult } from "./errors.ts";
import { currentMember } from "./session.ts";

const MEETING_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/;

export function cleanMeetingTime(value: string): string | null {
  const match = MEETING_TIME.exec(value.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (month < 1 || month > 12 || hour > 23 || minute > 59) {
    return null;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}`;
}

function openForMeeting(
  db: DatabaseSync,
  sessionId: string | null | undefined,
  adminOnly: boolean,
): ActionResult<{ clubId: string; memberId: string }> {
  const member = currentMember(db, sessionId);
  if (!member) {
    return actionFailure({ code: "not_signed_in" });
  }
  if (adminOnly && member.role !== "admin") {
    return actionFailure({ code: "not_an_admin" });
  }
  const club = db.prepare(
    "SELECT id, selected_suggestion_id, selected_meeting_time_id FROM book_clubs ORDER BY opened_at ASC LIMIT 1",
  ).get() as { id: string; selected_suggestion_id: string | null; selected_meeting_time_id: string | null } | undefined;
  if (!club?.selected_suggestion_id) {
    return actionFailure({ code: "book_not_selected" });
  }
  if (club.selected_meeting_time_id) {
    return actionFailure({ code: "meeting_already_selected" });
  }
  return { ok: true, value: { clubId: club.id, memberId: member.id } };
}

export function proposeMeetingTime(
  db: DatabaseSync,
  input: { sessionId: string | null | undefined; startsAt: string },
): ActionResult<{ id: string; startsAt: string }> {
  const open = openForMeeting(db, input.sessionId, true);
  if (!open.ok) {
    return open;
  }
  const startsAt = cleanMeetingTime(input.startsAt);
  if (!startsAt) {
    return actionFailure({ code: "meeting_time_invalid" });
  }
  const id = randomUUID();
  try {
    db.prepare(
      "INSERT INTO meeting_times (id, book_club_id, starts_at, proposed_at) VALUES (?, ?, ?, ?)",
    ).run(id, open.value.clubId, startsAt, new Date().toISOString());
  } catch (error) {
    if (isUniqueConstraint(error)) {
      return actionFailure({ code: "meeting_time_taken" });
    }
    throw error;
  }
  return { ok: true, value: { id, startsAt } };
}

export function removeMeetingTime(
  db: DatabaseSync,
  input: { sessionId: string | null | undefined; meetingTimeId: string },
): ActionResult<{ startsAt: string }> {
  const open = openForMeeting(db, input.sessionId, true);
  if (!open.ok) {
    return open;
  }
  const row = db.prepare(
    "SELECT id, starts_at FROM meeting_times WHERE id = ? AND book_club_id = ?",
  ).get(input.meetingTimeId, open.value.clubId) as { id: string; starts_at: string } | undefined;
  if (!row) {
    return actionFailure({ code: "meeting_time_not_found" });
  }
  db.prepare("DELETE FROM meeting_times WHERE id = ?").run(row.id);
  return { ok: true, value: { startsAt: row.starts_at } };
}

export function voteForMeetingTime(
  db: DatabaseSync,
  input: { sessionId: string | null | undefined; meetingTimeId: string },
): ActionResult<{ startsAt: string; recorded: boolean }> {
  const open = openForMeeting(db, input.sessionId, false);
  if (!open.ok) {
    return open;
  }
  const row = db.prepare(
    "SELECT id, starts_at FROM meeting_times WHERE id = ? AND book_club_id = ?",
  ).get(input.meetingTimeId, open.value.clubId) as { id: string; starts_at: string } | undefined;
  if (!row) {
    return actionFailure({ code: "meeting_time_not_found" });
  }
  const existing = db.prepare(
    "SELECT id FROM meeting_votes WHERE meeting_time_id = ? AND member_id = ?",
  ).get(row.id, open.value.memberId);
  if (!existing) {
    db.prepare(
      "INSERT INTO meeting_votes (id, meeting_time_id, member_id, voted_at) VALUES (?, ?, ?, ?)",
    ).run(randomUUID(), row.id, open.value.memberId, new Date().toISOString());
  }
  return { ok: true, value: { startsAt: row.starts_at, recorded: !existing } };
}

export function withdrawMeetingVote(
  db: DatabaseSync,
  input: { sessionId: string | null | undefined; meetingTimeId: string },
): ActionResult<{ startsAt: string; removed: boolean }> {
  const open = openForMeeting(db, input.sessionId, false);
  if (!open.ok) {
    return open;
  }
  const row = db.prepare(
    "SELECT id, starts_at FROM meeting_times WHERE id = ? AND book_club_id = ?",
  ).get(input.meetingTimeId, open.value.clubId) as { id: string; starts_at: string } | undefined;
  if (!row) {
    return actionFailure({ code: "meeting_time_not_found" });
  }
  const existing = db.prepare(
    "SELECT id FROM meeting_votes WHERE meeting_time_id = ? AND member_id = ?",
  ).get(row.id, open.value.memberId);
  if (existing) {
    db.prepare("DELETE FROM meeting_votes WHERE meeting_time_id = ? AND member_id = ?").run(row.id, open.value.memberId);
  }
  return { ok: true, value: { startsAt: row.starts_at, removed: Boolean(existing) } };
}

export function selectMeetingTime(
  db: DatabaseSync,
  input: { sessionId: string | null | undefined; meetingTimeId?: string | null },
): ActionResult<{ id: string; meetingTimeId: string; startsAt: string }> {
  const open = openForMeeting(db, input.sessionId, true);
  if (!open.ok) {
    return open as ActionResult<{ id: string; meetingTimeId: string; startsAt: string }>;
  }
  const ranked = db.prepare(
    `SELECT t.id, COUNT(v.id) AS votes
     FROM meeting_times t
     LEFT JOIN meeting_votes v ON v.meeting_time_id = t.id
     WHERE t.book_club_id = ?
     GROUP BY t.id
     ORDER BY votes DESC`,
  ).all(open.value.clubId) as { id: string; votes: number }[];
  if (ranked.length === 0) {
    return actionFailure({ code: "no_meeting_times" });
  }
  const topVotes = ranked[0]?.votes;
  const leaders = ranked.filter((row) => row.votes === topVotes);
  const requested = input.meetingTimeId || null;
  let meetingTimeId: string;
  if (leaders.length === 1) {
    if (requested && requested !== leaders[0]?.id) {
      return actionFailure({ code: "not_in_the_meeting_tie" });
    }
    meetingTimeId = leaders[0]?.id ?? "";
  } else if (!requested) {
    return actionFailure({ code: "meeting_tie" });
  } else if (!leaders.some((row) => row.id === requested)) {
    return actionFailure({ code: "not_in_the_meeting_tie" });
  } else {
    meetingTimeId = requested;
  }
  db.prepare("UPDATE book_clubs SET selected_meeting_time_id = ? WHERE id = ?").run(meetingTimeId, open.value.clubId);
  const chosen = db.prepare("SELECT starts_at FROM meeting_times WHERE id = ?").get(meetingTimeId) as { starts_at: string } | undefined;
  return { ok: true, value: { id: open.value.clubId, meetingTimeId, startsAt: chosen?.starts_at ?? "" } };
}
