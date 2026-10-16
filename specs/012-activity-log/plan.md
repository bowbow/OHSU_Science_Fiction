# Implementation Plan: Activity Log

**Branch**: `012-activity-log` | **Date**: 2026-10-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/012-activity-log/spec.md`

## Summary

Record each successful club action as one plain-English line. The sentence is built in the platform-independent core. The website appends that line to `activity.log` beside the SQLite database and prints the same line to standard output. Refusals, page views, unchanged repeat votes, passwords, and session identifiers are not recorded.

## Technical Context

**Language/Version**: TypeScript 7 on Node.js 24, run with `node --experimental-strip-types`

**Primary Dependencies**: Existing `@bookclub/core` and `@bookclub/web`. No new package.

**Storage**: Append-only text file `activity.log` in the same directory as the SQLite database (`/var/lib/bookclub/activity.log` on EC2, next to `bookclub.sqlite`). The same line is also written to the process standard output, which systemd already sends to the journal.

**Testing**: `node --experimental-strip-types --test` for core sentence tests and a website test that a successful sign-in, suggestion, and vote are recorded, and that a wrong password and an unchanged repeat vote are not.

**Target Platform**: The existing Node website on one EC2 instance. The sentence builder has no web dependency.

**Project Type**: TypeScript monorepo with a platform-independent core and one website client.

**Performance Goals**: Writing one line must not be noticeable to the member. A failed write must not fail the action.

**Constraints**: No passwords or session identifiers. No log line for a refused action. The file must live under `/var/lib/bookclub`, which the service may already write, so a new release does not delete it.

**Scale/Scope**: One club. One line per successful action listed in the specification.

## Constitution Check

*GATE: Passed before research and passed again after design.*

- **I. Specification Before Implementation**: PASS. This plan follows `specs/012-activity-log/spec.md`.
- **II. Verified Behavior**: PASS. Core tests cover every sentence and the UTC prefix. A website test covers a successful path, a refused sign-in, and an unchanged vote. Deployment retention is the same check already used for the SQLite file, named in the quickstart.
- **III. Club Data Stays in the Club**: PASS. The record is not served on any page. It stays on the server next to the database. Passwords and session identifiers are excluded.
- **IV. Smallest Design That Meets the Spec**: PASS. One sentence function and one append. No logging library, no database table, and no member-facing page.
- **V. Consistent, Recoverable Changes**: PASS. Existing club behavior is unchanged. A failed append does not roll back the action. Return values gain fields that existing callers can ignore; the two strict equality checks that name a removal result are updated.
- **VI. Platform-Independent Core**: PASS. Wording lives in `packages/core`. Writing the file and standard output is website-only. A future mobile client can reuse the same sentences.

## Project Structure

### Documentation (this feature)

```text
specs/012-activity-log/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── activity-lines.md
└── tasks.md
```

### Source Code (repository root)

```text
packages/core/src/activity.ts          # UTC prefix and sentences
packages/core/src/index.ts             # export the sentence builder
packages/core/src/book-club.ts         # report whether a vote, open, close, or removal changed anything
packages/core/src/meeting.ts           # report whether a meeting vote or withdrawal changed anything
packages/core/test/activity.test.ts

apps/web/src/activity-log.ts           # append the line and print it
apps/web/src/app.ts                    # record a line after each successful action
apps/web/src/server.ts                 # point the file at the database directory
apps/web/test/activity-log.test.ts
```

## Complexity Tracking

No constitution violations.
