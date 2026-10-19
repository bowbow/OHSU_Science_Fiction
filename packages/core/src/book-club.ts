import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { CatalogBook } from "./covers.ts";
import { actionFailure, isUniqueConstraint, type ActionResult } from "./errors.ts";
import { currentMember } from "./session.ts";

export type BookSuggestionView = {
  id: string;
  title: string;
  suggestedBy: string;
  votes: number;
  votedByMe: boolean;
  coverId: number | null;
  voters?: string[];
};

export type MeetingTimeView = {
  id: string;
  startsAt: string;
  votes: number;
  votedByMe: boolean;
};

export type BookClubRoundView = {
  id: string;
  status: "open_for_suggestions" | "suggestions_closed";
  selectedSuggestionId: string | null;
  selectedMeetingTimeId: string | null;
  suggestions: BookSuggestionView[];
  meetingTimes: MeetingTimeView[];
};

type RoundRow = {
  id: string;
  status: "open_for_suggestions" | "suggestions_closed";
  opened_at: string;
  selected_suggestion_id: string | null;
  selected_meeting_time_id: string | null;
};

type SuggestionRow = {
  id: string;
  title: string;
  username: string;
  votes: number;
  voted_by_me: number;
  cover_id: number | null;
};

export function cleanTitle(title: string): string {
  return title.trim().replaceAll(/\s+/g, " ");
}

export function normalizeTitle(title: string): string {
  return cleanTitle(title).toLocaleLowerCase();
}

export function bookClubRounds(db: DatabaseSync, sessionId: string | null | undefined): ActionResult<BookClubRoundView[]> {
  const member = currentMember(db, sessionId);
  if (!member) {
    return actionFailure({ code: "not_signed_in" });
  }
  const rounds = db.prepare(
    `SELECT id, status, opened_at, selected_suggestion_id, selected_meeting_time_id
     FROM book_clubs
     ORDER BY CASE WHEN status = 'open_for_suggestions' THEN 0 ELSE 1 END, opened_at ASC
     LIMIT 1`,
  ).all() as RoundRow[];
  const suggestions = db.prepare(
    `SELECT s.id, s.title, s.cover_id, m.username,
            COUNT(v.id) AS votes,
            SUM(CASE WHEN v.member_id = ? THEN 1 ELSE 0 END) AS voted_by_me
     FROM book_suggestions s
     JOIN members m ON m.id = s.suggested_by
     LEFT JOIN book_votes v ON v.suggestion_id = s.id
     WHERE s.book_club_id = ?
     GROUP BY s.id
     ORDER BY votes DESC, s.suggested_at ASC, s.rowid ASC`,
  );
  const meetingTimes = db.prepare(
    `SELECT t.id, t.starts_at,
            COUNT(v.id) AS votes,
            SUM(CASE WHEN v.member_id = ? THEN 1 ELSE 0 END) AS voted_by_me
     FROM meeting_times t
     LEFT JOIN meeting_votes v ON v.meeting_time_id = t.id
     WHERE t.book_club_id = ?
     GROUP BY t.id
     ORDER BY votes DESC, t.proposed_at ASC, t.rowid ASC`,
  );
  const suggestionVoters = member.role === "admin"
    ? db.prepare(
      `SELECT v.suggestion_id, m.username
       FROM book_votes v
       JOIN members m ON m.id = v.member_id
       JOIN book_suggestions s ON s.id = v.suggestion_id
       WHERE s.book_club_id = ?
       ORDER BY m.username COLLATE NOCASE, v.voted_at ASC`,
    )
    : null;
  return {
    ok: true,
    value: rounds.map((round) => {
      const votersBySuggestion = new Map<string, string[]>();
      if (suggestionVoters) {
        const voterRows = suggestionVoters.all(round.id) as { suggestion_id: string; username: string }[];
        for (const row of voterRows) {
          const voters = votersBySuggestion.get(row.suggestion_id) ?? [];
          voters.push(row.username);
          votersBySuggestion.set(row.suggestion_id, voters);
        }
      }
      return {
        id: round.id,
        status: round.status,
        selectedSuggestionId: round.selected_suggestion_id,
        selectedMeetingTimeId: round.selected_meeting_time_id,
        meetingTimes: (meetingTimes.all(member.id, round.id) as {
          id: string;
          starts_at: string;
          votes: number;
          voted_by_me: number | null;
        }[]).map((row) => ({
          id: row.id,
          startsAt: row.starts_at,
          votes: row.votes,
          votedByMe: row.voted_by_me === 1,
        })),
        suggestions: (suggestions.all(member.id, round.id) as SuggestionRow[]).map((row) => {
          const suggestion: BookSuggestionView = {
            id: row.id,
            title: row.title,
            suggestedBy: row.username,
            votes: row.votes,
            votedByMe: row.voted_by_me === 1,
            coverId: row.cover_id,
          };
          if (member.role === "admin") {
            suggestion.voters = votersBySuggestion.get(row.id) ?? [];
          }
          return suggestion;
        }),
      };
    }),
  };
}

export function openBookClub(db: DatabaseSync, sessionId: string | null | undefined): ActionResult<{ id: string; changed: boolean }> {
  const member = currentMember(db, sessionId);
  if (!member) {
    return actionFailure({ code: "not_signed_in" });
  }
  if (member.role !== "admin") {
    return actionFailure({ code: "not_an_admin" });
  }
  const open = db.prepare(
    "SELECT id FROM book_clubs WHERE status = 'open_for_suggestions' LIMIT 1",
  ).get() as { id: string } | undefined;
  if (open) {
    return { ok: true, value: { id: open.id, changed: false } };
  }
  const existing = db.prepare(
    "SELECT id, selected_suggestion_id FROM book_clubs ORDER BY opened_at ASC LIMIT 1",
  ).get() as { id: string; selected_suggestion_id: string | null } | undefined;
  if (existing?.selected_suggestion_id) {
    return actionFailure({ code: "book_already_selected" });
  }
  if (existing) {
    db.prepare(
      "UPDATE book_clubs SET status = 'open_for_suggestions', closed_at = NULL, selected_suggestion_id = NULL WHERE id = ?",
    ).run(existing.id);
    return { ok: true, value: { id: existing.id, changed: true } };
  }
  const id = randomUUID();
  db.prepare(
    `INSERT INTO book_clubs (id, status, opened_at, closed_at)
     VALUES (?, 'open_for_suggestions', ?, NULL)`,
  ).run(id, new Date().toISOString());
  return { ok: true, value: { id, changed: true } };
}

export function suggestBook(
  db: DatabaseSync,
  input: { sessionId: string | null | undefined; title: string },
): ActionResult<{ title: string }> {
  const member = currentMember(db, input.sessionId);
  if (!member) {
    return actionFailure({ code: "not_signed_in" });
  }
  if (member.role !== "admin") {
    return actionFailure({ code: "not_an_admin" });
  }
  const title = cleanTitle(input.title);
  if (!title) {
    return actionFailure({ code: "title_empty" });
  }
  const open = db.prepare(
    "SELECT id FROM book_clubs WHERE status = 'open_for_suggestions'",
  ).get() as { id: string } | undefined;
  if (!open) {
    return actionFailure({ code: "suggestions_closed" });
  }
  try {
    db.prepare(
      `INSERT INTO book_suggestions (
        id, book_club_id, title, title_normalized, suggested_by, suggested_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(randomUUID(), open.id, title, normalizeTitle(title), member.id, new Date().toISOString());
  } catch (error) {
    if (isUniqueConstraint(error)) {
      return actionFailure({ code: "already_suggested" });
    }
    throw error;
  }
  return { ok: true, value: { title } };
}

export async function suggestMatchedBook(
  db: DatabaseSync,
  input: { sessionId: string | null | undefined; title: string; coverId?: number | null },
  lookup: (title: string) => Promise<CatalogBook[]>,
): Promise<ActionResult<{ title: string; matches?: CatalogBook[] }>> {
  const member = currentMember(db, input.sessionId);
  if (!member) {
    return actionFailure({ code: "not_signed_in" });
  }
  if (member.role !== "admin") {
    return actionFailure({ code: "not_an_admin" });
  }
  const title = cleanTitle(input.title);
  if (!title) {
    return actionFailure({ code: "title_empty" });
  }
  const open = db.prepare(
    "SELECT id FROM book_clubs WHERE status = 'open_for_suggestions'",
  ).get() as { id: string } | undefined;
  if (!open) {
    return actionFailure({ code: "suggestions_closed" });
  }
  const duplicate = db.prepare(
    "SELECT id FROM book_suggestions WHERE book_club_id = ? AND title_normalized = ?",
  ).get(open.id, normalizeTitle(title));
  if (duplicate) {
    return actionFailure({ code: "already_suggested" });
  }
  let matches: CatalogBook[];
  try {
    matches = usableMatches(await lookup(title));
  } catch {
    return actionFailure({ code: "book_search_failed" });
  }
  const requested = input.coverId ?? null;
  if (matches.length > 1 && requested === null) {
    return { ok: true, value: { title, matches } };
  }
  const chosen = requested === null
    ? matches.length === 1 ? matches[0] : null
    : matches.find((match) => match.coverId === requested);
  if (requested !== null && !chosen) {
    return actionFailure({ code: "match_not_offered" });
  }
  try {
    db.prepare(
      `INSERT INTO book_suggestions (
        id, book_club_id, title, title_normalized, suggested_by, suggested_at, cover_id, cover_checked
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    ).run(
      randomUUID(),
      open.id,
      title,
      normalizeTitle(title),
      member.id,
      new Date().toISOString(),
      chosen?.coverId ?? null,
    );
  } catch (error) {
    if (isUniqueConstraint(error)) {
      return actionFailure({ code: "already_suggested" });
    }
    throw error;
  }
  return { ok: true, value: { title } };
}

function usableMatches(books: CatalogBook[]): CatalogBook[] {
  const seen = new Set<number>();
  const usable: CatalogBook[] = [];
  for (const book of books) {
    if (!Number.isInteger(book.coverId) || seen.has(book.coverId)) {
      continue;
    }
    seen.add(book.coverId);
    usable.push({
      title: book.title.trim(),
      authors: book.authors.trim(),
      year: Number.isInteger(book.year) ? book.year : null,
      coverId: book.coverId,
    });
  }
  return usable;
}

export function removeBookSuggestion(
  db: DatabaseSync,
  input: { sessionId: string | null | undefined; suggestionId: string },
): ActionResult<{ title: string; suggestedBy: string }> {
  const member = currentMember(db, input.sessionId);
  if (!member) {
    return actionFailure({ code: "not_signed_in" });
  }
  if (member.role !== "admin") {
    return actionFailure({ code: "not_an_admin" });
  }
  const row = db.prepare(
    `SELECT s.id, s.title, s.suggested_by, m.username AS suggested_by_name, c.status
     FROM book_suggestions s
     JOIN book_clubs c ON c.id = s.book_club_id
     JOIN members m ON m.id = s.suggested_by
     WHERE s.id = ?`,
  ).get(input.suggestionId) as { id: string; title: string; suggested_by: string; suggested_by_name: string; status: string } | undefined;
  if (!row) {
    return actionFailure({ code: "suggestion_not_found" });
  }
  if (row.status !== "open_for_suggestions") {
    return actionFailure({ code: "suggestions_closed" });
  }
  db.prepare("DELETE FROM book_suggestions WHERE id = ?").run(row.id);
  return { ok: true, value: { title: row.title, suggestedBy: row.suggested_by_name } };
}

export function voteForBook(
  db: DatabaseSync,
  input: { sessionId: string | null | undefined; suggestionId: string },
): ActionResult<{ title: string; placed: "new" | "moved" | "unchanged" }> {
  const member = currentMember(db, input.sessionId);
  if (!member) {
    return actionFailure({ code: "not_signed_in" });
  }
  const suggestion = db.prepare(
    `SELECT s.id, s.title, c.status
     FROM book_suggestions s
     JOIN book_clubs c ON c.id = s.book_club_id
     WHERE s.id = ?`,
  ).get(input.suggestionId) as { id: string; title: string; status: string } | undefined;
  if (!suggestion) {
    return actionFailure({ code: "suggestion_not_found" });
  }
  if (suggestion.status !== "open_for_suggestions") {
    return actionFailure({ code: "suggestions_closed" });
  }
  const existing = db.prepare(
    "SELECT suggestion_id FROM book_votes WHERE member_id = ?",
  ).get(member.id) as { suggestion_id: string } | undefined;
  if (existing?.suggestion_id === suggestion.id) {
    return { ok: true, value: { title: suggestion.title, placed: "unchanged" } };
  }
  const placed = existing ? "moved" : "new";
  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM book_votes WHERE member_id = ?").run(member.id);
    db.prepare(
      "INSERT INTO book_votes (id, suggestion_id, member_id, voted_at) VALUES (?, ?, ?, ?)",
    ).run(randomUUID(), suggestion.id, member.id, new Date().toISOString());
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return { ok: true, value: { title: suggestion.title, placed } };
}

export function closeBookClub(
  db: DatabaseSync,
  input: { sessionId: string | null | undefined; suggestionId?: string | null },
): ActionResult<{ id: string; selectedSuggestionId: string | null; selectedTitle: string | null }> {
  const member = currentMember(db, input.sessionId);
  if (!member) {
    return actionFailure({ code: "not_signed_in" });
  }
  if (member.role !== "admin") {
    return actionFailure({ code: "not_an_admin" });
  }
  const open = db.prepare(
    "SELECT id FROM book_clubs WHERE status = 'open_for_suggestions' LIMIT 1",
  ).get() as { id: string } | undefined;
  if (!open) {
    return actionFailure({ code: "suggestions_closed" });
  }
  const ranked = db.prepare(
    `SELECT s.id, COUNT(v.id) AS votes
     FROM book_suggestions s
     LEFT JOIN book_votes v ON v.suggestion_id = s.id
     WHERE s.book_club_id = ?
     GROUP BY s.id
     ORDER BY votes DESC`,
  ).all(open.id) as { id: string; votes: number }[];
  const topVotes = ranked[0]?.votes;
  const leaders = ranked.filter((row) => row.votes === topVotes);
  const requested = input.suggestionId || null;
  let selectedSuggestionId: string | null = null;
  if (leaders.length === 0) {
    selectedSuggestionId = null;
  } else if (leaders.length === 1) {
    if (requested && requested !== leaders[0]?.id) {
      return actionFailure({ code: "not_in_the_tie" });
    }
    selectedSuggestionId = leaders[0]?.id ?? null;
  } else if (!requested) {
    return actionFailure({ code: "vote_tie" });
  } else if (!leaders.some((row) => row.id === requested)) {
    return actionFailure({ code: "not_in_the_tie" });
  } else {
    selectedSuggestionId = requested;
  }
  db.prepare(
    `UPDATE book_clubs
     SET status = 'suggestions_closed', closed_at = ?, selected_suggestion_id = ?
     WHERE id = ?`,
  ).run(new Date().toISOString(), selectedSuggestionId, open.id);
  const selectedTitle = selectedSuggestionId
    ? (db.prepare("SELECT title FROM book_suggestions WHERE id = ?").get(selectedSuggestionId) as { title: string } | undefined)?.title ?? null
    : null;
  return { ok: true, value: { id: open.id, selectedSuggestionId, selectedTitle } };
}

export function startOver(db: DatabaseSync, sessionId: string | null | undefined): ActionResult<{ id: string }> {
  const member = currentMember(db, sessionId);
  if (!member) {
    return actionFailure({ code: "not_signed_in" });
  }
  if (member.role !== "admin") {
    return actionFailure({ code: "not_an_admin" });
  }
  const existing = db.prepare(
    "SELECT id, selected_suggestion_id FROM book_clubs ORDER BY opened_at ASC LIMIT 1",
  ).get() as { id: string; selected_suggestion_id: string | null } | undefined;
  if (!existing?.selected_suggestion_id) {
    return actionFailure({ code: "book_not_selected" });
  }
  db.exec("BEGIN");
  try {
    db.prepare(
      `UPDATE book_clubs
       SET status = 'open_for_suggestions', closed_at = NULL,
           selected_suggestion_id = NULL, selected_meeting_time_id = NULL
       WHERE id = ?`,
    ).run(existing.id);
    db.prepare("DELETE FROM meeting_times WHERE book_club_id = ?").run(existing.id);
    db.prepare("DELETE FROM book_suggestions WHERE book_club_id = ?").run(existing.id);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return { ok: true, value: { id: existing.id } };
}

export async function ensureBookCovers(
  db: DatabaseSync,
  sessionId: string | null | undefined,
  lookup: (title: string) => Promise<number | null>,
): Promise<void> {
  if (!currentMember(db, sessionId)) {
    return;
  }
  const pending = db.prepare(
    "SELECT id, title FROM book_suggestions WHERE cover_checked = 0",
  ).all() as { id: string; title: string }[];
  for (const row of pending) {
    let coverId: number | null;
    try {
      coverId = await lookup(row.title);
    } catch {
      continue;
    }
    db.prepare(
      "UPDATE book_suggestions SET cover_id = ?, cover_checked = 1 WHERE id = ?",
    ).run(coverId, row.id);
  }
}
