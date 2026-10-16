# Implementation Plan: Remove Book Suggestions

**Branch**: `003-remove-book-suggestions` | **Date**: 2026-10-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-remove-book-suggestions/spec.md`

## Summary

A signed-in member can remove a book they suggested. An admin can remove any book on the one list. The suggestion row is deleted. Other suggestions stay, and the same title can be suggested again.

The rule lives in the existing TypeScript core. The website shows a Remove action only for books that member is allowed to remove.

## Technical Context

**Language/Version**: TypeScript 7.0 on Node.js 24 LTS

**Primary Dependencies**: None beyond the existing core and website.

**Storage**: Existing SQLite table `book_suggestions`. No new table. Removal deletes that suggestion row.

**Testing**: `node:test` for who may remove a suggestion. Website tests cover which list items show Remove and that a forbidden removal leaves the book.

**Target Platform**: The existing Node.js website. No mobile app in this feature.

**Project Type**: Addition to `@bookclub/core` and `@bookclub/web`.

**Performance Goals**: A member can remove an allowed book and see the updated list in under 1 minute including their own action.

**Constraints**: Core imports no web UI. The page does not decide permission on its own. A regular member's Remove control is hidden for other people's books, and the core still refuses that removal. No voting, meetings, or discussion.

**Scale/Scope**: One book club and its existing suggestion list.

## Constitution Check

- **I. Specification Before Implementation**: PASS. This plan implements `spec.md` only.
- **II. Verified Behavior**: PASS. Core tests cover own removal, another member's refusal, admin removal, and suggesting the title again. Website tests cover which Remove actions appear and the forbidden-removal sentence. `quickstart.md` names the browser walk-through.
- **III. Club Data Stays in the Club**: PASS. Suggestion titles stay visible only to signed-in members. A signed-out removal receives no titles.
- **IV. Smallest Design That Meets the Spec**: PASS. Delete the existing suggestion row. No new dependency and no confirmation step.
- **V. Consistent, Recoverable Changes**: PASS. Suggesting, opening, and the member list stay. A removed title can be suggested again because the unique title row is gone. Feature 002 already said a suggestion remains until a later feature removes it.
- **VI. Platform-Independent Core**: PASS. Who may remove a suggestion is a core operation. The website only renders the action and calls the core.

## Project Structure

```text
packages/core/src/book-club.ts
packages/core/test/book-club.test.ts
apps/web/src/book-club-page.ts
apps/web/test/book-club-page.test.ts
```

The new website route is `POST /book-club/suggestions/remove`.

## Post-Design Constitution Check

- Removal permission is in the core contract, not reimplemented as the only check in the page.
- Deleting one suggestion row does not delete the book club or any other suggestion.
- All gates above still pass.
