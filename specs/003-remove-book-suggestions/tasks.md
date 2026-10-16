# Tasks: Remove Book Suggestions

**Input**: Design documents from `/specs/003-remove-book-suggestions/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. The constitution requires every acceptance scenario to be covered by an automated test or a named manual check.

**Organization**: Setup is already done by features 001 and 002. Story tasks add removal on that foundation.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: User Story 1 - A member removes their own suggestion (Priority: P1)

**Goal**: A regular member can remove a book they suggested, and cannot remove someone else's book.

**Independent Test**: Suggest two titles from two members. The regular member removes only their own title, then can suggest it again.

### Tests for User Story 1

- [X] T001 [US1] Cover own removal, a refused removal of someone else's book, and suggesting that title again in `packages/core/test/book-club.test.ts`
- [X] T002 [US1] Cover Remove beside the member's own book only, and the forbidden-removal sentence, in `apps/web/test/book-club-page.test.ts`

### Implementation for User Story 1

- [X] T003 [US1] Return each suggestion id from `bookClubRounds` and add `removeBookSuggestion` in `packages/core/src/book-club.ts` and `packages/core/src/index.ts`
- [X] T004 [US1] Add `not_your_suggestion` and `suggestion_not_found` in `packages/core/src/errors.ts` and `apps/web/src/messages.ts`
- [X] T005 [US1] Show Remove only on the signed-in member's own books and handle `POST /book-club/suggestions/remove` in `apps/web/src/book-club-page.ts` and `apps/web/src/app.ts`

**Checkpoint**: A regular member can remove their own suggestion and cannot remove another person's.

---

## Phase 2: User Story 2 - An admin removes any suggestion (Priority: P1)

**Goal**: An admin can remove any book on the list.

**Independent Test**: An admin sees Remove on every book and removes a book suggested by a regular member.

### Tests for User Story 2

- [X] T006 [US2] Cover an admin removing another member's suggestion in `packages/core/test/book-club.test.ts`
- [X] T007 [US2] Cover Remove beside every book for an admin in `apps/web/test/book-club-page.test.ts`

### Implementation for User Story 2

- [X] T008 [US2] Allow `role === "admin"` in `removeBookSuggestion` in `packages/core/src/book-club.ts`
- [X] T009 [US2] Show Remove beside every book when the signed-in member is an admin in `apps/web/src/book-club-page.ts`

**Checkpoint**: Admins can remove any suggestion. Regular members still cannot remove someone else's.

---

## Phase 3: Polish

- [X] T010 Run `quickstart.md` in the browser at http://127.0.0.1:3456

---

## Dependencies & Execution Order

- User Story 1 creates the removal operation. User Story 2 is the admin branch of that same operation.
- T001 and T002 can be written together. T003, T004, and T005 follow them.
- T006 through T009 use the operation from User Story 1.
- T010 follows both stories.
