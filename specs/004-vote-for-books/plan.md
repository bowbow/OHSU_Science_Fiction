# Implementation Plan: Vote for a Book

**Branch**: `004-vote-for-books` | **Date**: 2026-10-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-vote-for-books/spec.md`

## Summary

Each signed-in member has one vote on the suggestion list. Voting for a different book moves that vote. Every book shows its count, and the list is ordered with the most votes first. Equal counts keep the earlier suggestion first.

The rule lives in the existing TypeScript core. The website shows the count, marks the member's current vote, and offers Vote on the other books.

## Technical Context

**Language/Version**: TypeScript 7.0 on Node.js 24 LTS

**Primary Dependencies**: None beyond the existing core and website.

**Storage**: New SQLite table `book_votes`, one row per member, referencing `book_suggestions`. Deleting a suggestion deletes its votes.

**Testing**: `node:test` for a first vote, a moved vote, equal-count order, and votes removed with a book. Website tests cover the count text, "Your vote", and the order on the page.

**Target Platform**: The existing Node.js website. No mobile app in this feature.

**Project Type**: Addition to `@bookclub/core` and `@bookclub/web`.

**Performance Goals**: A member can vote and see the new count and order in under 1 minute including their own action.

**Constraints**: Core imports no web UI. A member cannot hold two votes. No winner, meeting, or discussion.

**Scale/Scope**: One book club and its existing suggestion list.

## Constitution Check

- **I. Specification Before Implementation**: PASS. This plan implements `spec.md` only.
- **II. Verified Behavior**: PASS. Core tests cover the acceptance scenarios. Website tests cover the count, the member's vote, and the order. `quickstart.md` names the browser walk-through.
- **III. Club Data Stays in the Club**: PASS. Counts and titles are returned only for a signed-in member.
- **IV. Smallest Design That Meets the Spec**: PASS. One vote row per member. No new dependency.
- **V. Consistent, Recoverable Changes**: PASS. Suggesting, opening, and removal stay. The list order changes from oldest first to most votes first, which the spec states. A database created before this feature gains `book_votes` on startup.
- **VI. Platform-Independent Core**: PASS. Casting and moving a vote, and the ordered counts, are core operations. The website only renders them.

## Project Structure

```text
packages/core/src/db.ts
packages/core/src/book-club.ts
packages/core/test/book-club.test.ts
apps/web/src/book-club-page.ts
apps/web/test/book-club-page.test.ts
```

The new website route is `POST /book-club/votes`.

## Post-Design Constitution Check

- One vote per member is enforced in the core.
- Removing a suggestion removes only that suggestion's votes.
- All gates above still pass.
