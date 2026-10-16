# Implementation Plan: Member Registration

**Branch**: `001-member-registration` | **Date**: 2026-10-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-member-registration/spec.md`

## Summary

A person can register and later sign in with a username and password. Google sign-in is not part of this feature. A sign-in lasts until sign-out, and wrong attempts are not limited or slowed.

The member rules live in a TypeScript core library with no web or mobile UI. The first client is a small Node.js website that calls that core in-process and stores members in SQLite. Core tests run without starting the website. A mobile app is a later client of the same core, not part of this feature.

## Technical Context

**Language/Version**: TypeScript 7.0 on Node.js 24 LTS

**Primary Dependencies**: None. `node:sqlite`, `node:crypto`, `node:http`, and `node:test` are built in. The website does not depend on a Google client.

**Storage**: SQLite file for the website; in-memory SQLite for core tests

**Testing**: `node:test` for the core, with no browser. Website checks cover forms and the persistent session cookie.

**Target Platform**: Node.js process serving a browser website. No mobile app in this feature.

**Project Type**: TypeScript library (core) plus a server-rendered website client

**Performance Goals**: A valid registration finishes in under 2 minutes, and a return sign-in in under 1 minute, including the person's own actions. The site accepts 50 registration attempts in the same minute without refusing a valid new member because of crowding.

**Constraints**: Core imports no web UI, mobile UI, or browser APIs. Passwords are stored only as `scrypt` hashes. Sessions have no application expiry. Sign-in attempts are never locked or delayed. Hosting beyond a local Node.js process is not chosen for this feature. Google sign-in is out of scope.

**Scale/Scope**: A fun book club site. This feature covers registration, sign-in, sign-out, and the signed-in account view only.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Specification Before Implementation**: PASS. This plan implements only `spec.md`. Club joining, password change, and admin reset stay out.
- **II. Verified Behavior**: PASS. Core acceptance cases run in `node:test` without a website. Website paths in `quickstart.md` cover the browser-only cases (hidden password, cookie still present after leaving).
- **III. Club Data Stays in the Club**: PASS. Password hashes are not returned to other people. Failed sign-in does not reveal whether a username exists. Secrets are not committed; the SQLite file stays in local data, not in source.
- **IV. Smallest Design That Meets the Spec**: PASS. One core library and one website, built-in HTTP, built-in SQLite, and built-in tests. The core split is the standing requirement of Principle VI, not an extra abstraction.
- **V. Consistent, Recoverable Changes**: PASS. There is no prior member behavior to break. Sessions are not expired by a new timeout.
- **VI. Platform-Independent Core**: PASS. Core behavior is listed below. Website-only behavior is listed below. Building the website now does not add a mobile UI dependency to the core.

Core (no website required):

- Username and password validation, uniqueness, and hashing
- Create a member, then sign in and sign out, with the session left open until sign-out
- Unlimited password checks with one failure result
- The signed-in member view, which shows that member's username

Website client only:

- HTML forms and the hidden password field
- The persistent session cookie
- Mapping core failure codes to the sentences a person reads

## Project Structure

### Documentation (this feature)

```text
specs/001-member-registration/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 data model
├── quickstart.md        # Phase 1 validation guide
├── contracts/
│   ├── core-api.md      # Library contract
│   └── web-pages.md     # Website contract
└── tasks.md             # Created later by /speckit-tasks
```

### Source Code (repository root)

```text
package.json                 # npm workspaces
packages/core/
├── package.json             # name: @bookclub/core, no UI dependencies
├── src/                     # member rules and SQLite store
└── test/                    # node:test, in-memory SQLite
apps/web/
├── package.json             # name: @bookclub/web
├── src/                     # node:http pages and cookie
└── test/                    # page and cookie checks, no core-rule copies
```

**Structure Decision**: npm workspaces with `@bookclub/core` and `@bookclub/web`. The website depends on the core. The core does not depend on the website. A later mobile app would be a third workspace that also depends on the core. That app is not created in this feature.

## Complexity Tracking

No constitution violations. Nothing is recorded here.

## Post-Design Constitution Check

Re-checked after `research.md`, `data-model.md`, `contracts/`, and `quickstart.md`.

- The core contract has no HTTP, HTML, or cookie.
- Google registration and sign-in are not in the core or the website.
- The data model has no lockout fields and no session expiry, matching the clarifications.
- Core tests are specified to run against in-memory SQLite without a website.
- All gates above still pass.
