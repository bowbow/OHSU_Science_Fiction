# Tasks: Book Covers

**Input**: Design documents from `/specs/005-book-covers/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. The constitution requires every acceptance scenario to be covered by an automated test or a named manual check.

## Phase 1: User Story 1 - A suggestion shows a cover when one can be found (Priority: P1)

**Goal**: Show one cover beside a title when a lookup finds one, and leave the title as text when it does not.

**Independent Test**: A stand-in lookup returns a cover for one title and nothing for another. The page shows an image only for the first.

### Tests

- [X] T001 [US1] Cover a found cover, a missing cover, and a failed lookup in `packages/core/test/book-club.test.ts`
- [X] T002 [US1] Cover the image address and the text-only card in `apps/web/test/book-club-page.test.ts`

### Implementation

- [X] T003 [US1] Store `cover_id` and `cover_checked` in `packages/core/src/db.ts`
- [X] T004 [US1] Add Open Library lookup and `ensureBookCovers` in `packages/core/src/covers.ts`, `packages/core/src/book-club.ts`, and `packages/core/src/index.ts`
- [X] T005 [US1] Show the cover on the book card and look up covers when the book club page is rendered in `apps/web/src/book-club-page.ts`, `apps/web/src/app.ts`, and `apps/web/src/server.ts`

**Checkpoint**: Known titles can show a cover. Unknown titles stay text. One suggestion per title stays.

## Phase 2: Polish

- [X] T006 Run `quickstart.md` in the browser at http://127.0.0.1:3456
