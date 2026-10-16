import type { DatabaseSync } from "node:sqlite";
import { bookClubRounds as bookClubRoundsFn, closeBookClub as closeBookClubFn, ensureBookCovers as ensureBookCoversFn, openBookClub as openBookClubFn, removeBookSuggestion as removeBookSuggestionFn, startOver as startOverFn, suggestBook as suggestBookFn, suggestMatchedBook as suggestMatchedBookFn, voteForBook as voteForBookFn } from "./book-club.ts";
export { findOpenLibraryBooks, findOpenLibraryCoverId } from "./covers.ts";
export type { CatalogBook } from "./covers.ts";
import { proposeMeetingTime as proposeMeetingTimeFn, removeMeetingTime as removeMeetingTimeFn, selectMeetingTime as selectMeetingTimeFn, voteForMeetingTime as voteForMeetingTimeFn, withdrawMeetingVote as withdrawMeetingVoteFn } from "./meeting.ts";
import { openDatabase } from "./db.ts";
import { registerWithPassword as registerWithPasswordFn } from "./register-password.ts";
import { currentMember as currentMemberFn, endSession } from "./session.ts";
import { seedAdminMembers } from "./seed-admins.ts";
import { signInWithPassword as signInWithPasswordFn } from "./sign-in-password.ts";

export { activityLine, activitySentence } from "./activity.ts";
export type { ActivityEvent } from "./activity.ts";
export type { ActionResult, CoreFailure, Result } from "./errors.ts";
export type { BookClubRoundView, BookSuggestionView, MeetingTimeView } from "./book-club.ts";
export type { MemberRole, MemberView } from "./member-view.ts";

export class Core {
  readonly db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  registerWithPassword(input: { username: string; password: string; sessionId?: string | null }) {
    return registerWithPasswordFn(this.db, input);
  }

  signInWithPassword(input: { username: string; password: string }) {
    return signInWithPasswordFn(this.db, input);
  }

  signOut(sessionId: string) {
    endSession(this.db, sessionId);
  }

  currentMember(sessionId: string | null | undefined) {
    return currentMemberFn(this.db, sessionId);
  }

  bookClubRounds(sessionId: string | null | undefined) {
    return bookClubRoundsFn(this.db, sessionId);
  }

  openBookClub(sessionId: string | null | undefined) {
    return openBookClubFn(this.db, sessionId);
  }

  closeBookClub(input: { sessionId: string | null | undefined; suggestionId?: string | null }) {
    return closeBookClubFn(this.db, input);
  }

  startOver(sessionId: string | null | undefined) {
    return startOverFn(this.db, sessionId);
  }

  suggestBook(input: { sessionId: string | null | undefined; title: string }) {
    return suggestBookFn(this.db, input);
  }

  suggestMatchedBook(
    input: { sessionId: string | null | undefined; title: string; coverId?: number | null },
    lookup: (title: string) => Promise<import("./covers.ts").CatalogBook[]>,
  ) {
    return suggestMatchedBookFn(this.db, input, lookup);
  }

  removeBookSuggestion(input: { sessionId: string | null | undefined; suggestionId: string }) {
    return removeBookSuggestionFn(this.db, input);
  }

  voteForBook(input: { sessionId: string | null | undefined; suggestionId: string }) {
    return voteForBookFn(this.db, input);
  }

  proposeMeetingTime(input: { sessionId: string | null | undefined; startsAt: string }) {
    return proposeMeetingTimeFn(this.db, input);
  }

  removeMeetingTime(input: { sessionId: string | null | undefined; meetingTimeId: string }) {
    return removeMeetingTimeFn(this.db, input);
  }

  voteForMeetingTime(input: { sessionId: string | null | undefined; meetingTimeId: string }) {
    return voteForMeetingTimeFn(this.db, input);
  }

  withdrawMeetingVote(input: { sessionId: string | null | undefined; meetingTimeId: string }) {
    return withdrawMeetingVoteFn(this.db, input);
  }

  selectMeetingTime(input: { sessionId: string | null | undefined; meetingTimeId?: string | null }) {
    return selectMeetingTimeFn(this.db, input);
  }

  ensureBookCovers(sessionId: string | null | undefined, lookup: (title: string) => Promise<number | null>) {
    return ensureBookCoversFn(this.db, sessionId, lookup);
  }
}

export function openCore(path: string): Core {
  const db = openDatabase(path);
  seedAdminMembers(db);
  return new Core(db);
}
