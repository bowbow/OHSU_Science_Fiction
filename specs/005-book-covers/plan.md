# Implementation Plan: Book Covers

**Branch**: `005-book-covers` | **Date**: 2026-10-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-book-covers/spec.md`

## Summary

Each suggestion is looked up by title. The first Open Library match that has a cover is stored and shown beside the title. No match, or a failed lookup, leaves the text card. The club still has one suggestion per title, so catalog duplicates do not create a second row and the member is not asked to pick an edition.

## Technical Context

**Language/Version**: TypeScript 7.0 on Node.js 24 LTS

**Primary Dependencies**: None. Cover search uses Open Library's public search and cover images.

**Storage**: `cover_id` and `cover_checked` on the existing `book_suggestions` table. Older databases gain the columns on startup.

**Testing**: `node:test` with a stand-in lookup. The website test checks the image address and the text-only card. `quickstart.md` names the browser check against the live catalog.

**Target Platform**: The existing Node.js website. No mobile app in this feature.

**Project Type**: Addition to `@bookclub/core` and `@bookclub/web`.

**Performance Goals**: A cover appears on the next view of the list after the lookup finishes. Later views read the stored result.

**Constraints**: Core imports no web UI. Tests do not call Open Library. A failed lookup does not delete the suggestion.

**Scale/Scope**: One book club and its existing suggestion list.

## Constitution Check

- **I. Specification Before Implementation**: PASS. This plan implements `spec.md` only.
- **II. Verified Behavior**: PASS. Core tests cover found, missing, and failed lookups. The page test covers the image and the text fallback. `quickstart.md` names the live check.
- **III. Club Data Stays in the Club**: PASS. Covers are shown only on the signed-in book club page, with the titles.
- **IV. Smallest Design That Meets the Spec**: PASS. Two columns and one public catalog. No edition picker.
- **V. Consistent, Recoverable Changes**: PASS. Existing suggestions gain the columns with no covers until the first successful lookup. Duplicate-title refusal stays.
- **VI. Platform-Independent Core**: PASS. The lookup and the stored cover id are core behavior. The website only renders the image.

## Project Structure

```text
packages/core/src/covers.ts
packages/core/src/book-club.ts
packages/core/src/db.ts
packages/core/test/book-club.test.ts
apps/web/src/book-club-page.ts
apps/web/src/app.ts
apps/web/test/book-club-page.test.ts
```

## Post-Design Constitution Check

- The website does not choose which catalog match to keep.
- A missing cover does not remove title, votes, or the suggester tooltip.
- All gates above still pass.
