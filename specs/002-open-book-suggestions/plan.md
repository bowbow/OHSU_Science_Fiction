# Implementation Plan: Open Book Suggestions

**Branch**: `002-open-book-suggestions` | **Date**: 2026-10-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-open-book-suggestions/spec.md`

## Summary

There is one book club. An admin sees its state after sign-in and can set it to "Open for book suggestions". Admins and regular members can then add titles to the same list. The site keeps each title with the member who suggested it.

Rules live in the existing TypeScript core. The website is a client of that core. Storage stays in the same SQLite database as members.

## Technical Context

**Language/Version**: TypeScript 7.0 on Node.js 24 LTS

**Primary Dependencies**: None beyond the existing core and website.

**Storage**: SQLite tables `book_clubs` and `book_suggestions` in the same database as members.

**Testing**: `node:test` for core rules with an in-memory database. Website tests cover who sees the list, the open action, and the suggest form.

**Target Platform**: The existing Node.js website. No mobile app in this feature.

**Project Type**: Addition to `@bookclub/core` and `@bookclub/web`.

**Performance Goals**: An admin can open suggestions, and a regular member can suggest a book, in under 1 minute including their own actions.

**Constraints**: Core imports no web UI. Only one round may have status `open_for_suggestions`. Titles are trimmed, internal whitespace is collapsed, and uniqueness ignores letter case. No voting, meetings, or discussion.

**Scale/Scope**: One site-wide sequence of rounds. This feature adds the Book club page only.

## Constitution Check

- **I. Specification Before Implementation**: PASS. This plan implements `spec.md` only.
- **II. Verified Behavior**: PASS. Core tests cover the acceptance scenarios. Website tests cover the page text and who can submit each form. `quickstart.md` names the browser walk-through.
- **III. Club Data Stays in the Club**: PASS. Suggestion titles are returned only for a signed-in member. A signed-out request does not receive titles.
- **IV. Smallest Design That Meets the Spec**: PASS. Two tables and one page. No new dependency.
- **V. Consistent, Recoverable Changes**: PASS. Member registration behavior stays. New tables do not change existing member rows. A database created before this feature gains the tables on startup because the schema uses `CREATE TABLE IF NOT EXISTS`.
- **VI. Platform-Independent Core**: PASS. Opening a round, suggesting a title, and reading the lists are core operations. The website only renders them.

## Project Structure

```text
packages/core/src/book-club.ts
packages/core/test/book-club.test.ts
apps/web/src/book-club-page.ts
apps/web/test/book-club-page.test.ts
```

The website route is `GET /book-club`, `POST /book-club/open`, and `POST /book-club/suggestions`.

## Post-Design Constitution Check

- Suggestion rules are in the core contract, not reimplemented in the page.
- Earlier rounds stay in the database when a new round opens.
- All gates above still pass.
