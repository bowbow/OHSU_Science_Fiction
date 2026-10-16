# Tasks: Activity Log

**Input**: Design documents from `/specs/012-activity-log/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/activity-lines.md, quickstart.md

**Tests**: Required by the constitution. Core sentence tests and one website test cover the specified scenarios. Deployment retention is the manual check in quickstart.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Sentences

**Purpose**: One place that writes the specified line

- [x] T001 [P] [US1] Add `activityLine` in `packages/core/src/activity.ts` for every sentence in `contracts/activity-lines.md`, and export it from `packages/core/src/index.ts`
- [x] T002 [P] [US1] Add `packages/core/test/activity.test.ts` asserting the UTC prefix, every sentence, and that a password is not part of the line builder

## Phase 2: User Story 1 - Membership and books (Priority: P1)

**Goal**: Successful membership and book actions append the specified sentence

**Independent Test**: Register, sign out, sign in, suggest, vote, move a vote, remove a book, open suggestions, choose a book, and start a new book. Each adds one line. A wrong password and an unchanged vote add none.

- [x] T003 [US1] Return whether a book vote is new, moved, or unchanged, whether opening suggestions changed anything, the selected title when the call closes, and the suggester's display name when a book is removed, in `packages/core/src/book-club.ts`
- [x] T004 [US1] Update the two removal assertions in `packages/core/test/book-club.test.ts` to include the suggester's display name
- [x] T005 [US1] Return those facts from the website form helpers in `apps/web/src/sign-in-page.ts`, `apps/web/src/register-page.ts`, and `apps/web/src/book-club-page.ts`
- [x] T006 [US1] Append and print a line from `apps/web/src/activity-log.ts` after each successful membership or book action in `apps/web/src/app.ts`, and point the file beside the database in `apps/web/src/server.ts`

## Phase 3: User Story 2 - Meetings (Priority: P1)

**Goal**: Successful meeting actions use the same record and the site's meeting wording

**Independent Test**: Propose, vote, withdraw, remove, and choose a meeting time. Each adds one line. Voting or withdrawing again when nothing changes adds none.

- [x] T007 [US2] Return whether a meeting vote was added, whether a withdrawal removed a vote, and the chosen time, in `packages/core/src/meeting.ts`
- [x] T008 [US2] Record those meeting lines from `apps/web/src/app.ts` using `formatMeetingTime`

## Phase 4: User Story 3 - Quiet, private, kept

**Goal**: Refusals and secrets stay out, and the file survives a release because it sits with the database

**Independent Test**: Website test for a wrong password, an unchanged vote, and absence of the password. Quickstart check 5 confirms the file path on EC2.

- [x] T009 [US3] Add `apps/web/test/activity-log.test.ts` for a successful sign-in, suggestion, and vote, a wrong password, an unchanged vote, and the absence of the password
- [x] T010 [US3] Confirm no page route reads `activity.log`

## Dependencies

T003 before T005. T001 and T003 before T006. T007 before T008. T006 and T008 before T009.

## Manual check

Deploying a new release leaves `/var/lib/bookclub/activity.log` in place. Confirmed by quickstart check 5; no automated EC2 test is added.
