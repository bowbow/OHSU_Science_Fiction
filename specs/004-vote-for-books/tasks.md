# Tasks: Vote for a Book

**Input**: Design documents from `/specs/004-vote-for-books/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. The constitution requires every acceptance scenario to be covered by an automated test or a named manual check.

## Phase 1: User Story 1 - A member casts their one vote (Priority: P1)

**Goal**: Signed-in members can vote, every book shows its count, and the most votes are listed first.

**Independent Test**: Two suggestions start at zero votes. One member votes, and that book moves to the top with one vote.

### Tests for User Story 1

- [X] T001 [US1] Cover zero votes, one vote, two votes on one book, and equal-count order in `packages/core/test/book-club.test.ts`
- [X] T002 [US1] Cover the count text and the most-votes-first order in `apps/web/test/book-club-page.test.ts`

### Implementation for User Story 1

- [X] T003 [US1] Add `book_votes` in `packages/core/src/db.ts`
- [X] T004 [US1] Return vote counts in order and add `voteForBook` in `packages/core/src/book-club.ts` and `packages/core/src/index.ts`
- [X] T005 [US1] Show the count and the Vote action, and handle `POST /book-club/votes`, in `apps/web/src/book-club-page.ts` and `apps/web/src/app.ts`

**Checkpoint**: A member can cast one vote and see the count and order.

---

## Phase 2: User Story 2 - A member moves their vote (Priority: P1)

**Goal**: Voting for a different book moves the member's single vote, and the current choice is marked.

**Independent Test**: Vote for Book A, then Book B. Book A loses the vote, Book B gains it, and only Book B says "Your vote".

### Tests for User Story 2

- [X] T006 [US2] Cover moving a vote, voting twice for the same book, and a removed book freeing that vote in `packages/core/test/book-club.test.ts`
- [X] T007 [US2] Cover "Your vote" moving from one book to another in `apps/web/test/book-club-page.test.ts`

### Implementation for User Story 2

- [X] T008 [US2] Replace the member's existing vote inside `voteForBook` in `packages/core/src/book-club.ts`
- [X] T009 [US2] Mark the current vote and leave Vote on the other books in `apps/web/src/book-club-page.ts`

**Checkpoint**: A member can move their one vote, and removing a book clears the votes on it.

---

## Phase 3: Polish

- [X] T010 Run `quickstart.md` in the browser at http://127.0.0.1:3456

---

## Dependencies & Execution Order

- User Story 1 adds the vote row, the count, and the first vote.
- User Story 2 is the same operation when the member already has a vote.
- T010 follows both stories.
