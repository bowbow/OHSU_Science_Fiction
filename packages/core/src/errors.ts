export type UsernameInvalidReason =
  | "empty"
  | "too_short"
  | "too_long"
  | "bad_characters"
  | "must_start_alphanumeric";

export type CoreFailure =
  | { code: "username_invalid"; reason: UsernameInvalidReason }
  | { code: "username_taken" }
  | { code: "invalid_credentials" }
  | { code: "already_signed_in" }
  | { code: "not_signed_in" }
  | { code: "not_an_admin" }
  | { code: "not_a_regular_member" }
  | { code: "suggestions_closed" }
  | { code: "title_empty" }
  | { code: "already_suggested" }
  | { code: "not_your_suggestion" }
  | { code: "suggestion_not_found" }
  | { code: "book_already_selected" }
  | { code: "book_not_selected" }
  | { code: "book_search_failed" }
  | { code: "match_not_offered" }
  | { code: "vote_tie" }
  | { code: "not_in_the_tie" }
  | { code: "meeting_time_invalid" }
  | { code: "meeting_time_taken" }
  | { code: "meeting_time_not_found" }
  | { code: "meeting_tie" }
  | { code: "not_in_the_meeting_tie" }
  | { code: "no_meeting_times" }
  | { code: "meeting_already_selected" };

export type Result =
  | { ok: true; sessionId: string; member: import("./member-view.ts").MemberView }
  | { ok: false; failure: CoreFailure };

export function failure(failure: CoreFailure): Result {
  return { ok: false, failure };
}

export type ActionResult<T> = { ok: true; value: T } | { ok: false; failure: CoreFailure };

export function actionFailure<T>(failure: CoreFailure): ActionResult<T> {
  return { ok: false, failure };
}

export function isUniqueConstraint(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return /UNIQUE constraint failed/i.test(error.message);
}
