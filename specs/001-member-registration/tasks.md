---

description: "Task list for member registration"
---

# Tasks: Member Registration

Google registration and Google sign-in were removed from the spec on 2026-10-05. Tasks for those stories are obsolete and must not be reimplemented.

**Input**: Design documents from `/specs/001-member-registration/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included. Constitution Principle II requires every acceptance scenario to be covered by an automated test or a named manual check, and plan.md assigns core behavior to `node:test` with no website running. Write each story's tests first and confirm they fail before that story's implementation.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Core library**: `packages/core/`
- **Website client**: `apps/web/`
- Paths follow `plan.md` (npm workspaces `@bookclub/core` and `@bookclub/web`)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create npm workspaces in `package.json` for `packages/core` and `apps/web`, with Node.js 24 engines and TypeScript 7.0 as a dev dependency
- [X] T002 [P] Create `packages/core/package.json` for `@bookclub/core` with zero runtime dependencies and a `node:test` script
- [X] T003 [P] Create `apps/web/package.json` for `@bookclub/web` depending on `@bookclub/core` and `google-auth-library`
- [X] T004 [P] Add a TypeScript 7.0 Node.js 24 config in `packages/core/tsconfig.json`
- [X] T005 [P] Add a TypeScript 7.0 Node.js 24 config in `apps/web/tsconfig.json`
- [X] T006 [P] Ignore `node_modules`, SQLite files, and local env files in `.gitignore`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Create the member and session tables in `packages/core/src/db.ts`. Member fields: `id` "Opaque id assigned by the core. Never chosen by the visitor."; `sign_in_method` "`password` or `google`"; `username` "Trimmed display casing the member chose. 3–30 characters. Letters, numbers, hyphens, and underscores. Must start with a letter or number. No spaces after trimming."; `username_normalized` "Case-folded username. Unique across all members."; `password_hash` "`scrypt` hash. Never returned by any core operation or page."; `password_salt` "Random salt for that hash. Never returned."; `google_sub` "Stable Google account id. Unique across all members."; `google_email` "Email from the verified Google account. Visible only to that signed-in member." Enforce "A `password` member has username, normalized username, hash, and salt, and has no Google id or email" and "A `google` member has Google id and email, and has no username or password fields." Session fields: unguessable `id`, `member_id`, `created_at`, and `ended_at` "Empty while signed in. Set when the member signs out." "There is no expiry column. Time passing does not end a session." Do not add clubs, a second sign-in method, password reset, or "Failed-attempt counters or lockout timestamps."
- [X] T008 [P] Define the failure codes from `specs/001-member-registration/contracts/core-api.md` in `packages/core/src/errors.ts`
- [X] T009 [P] Define the signed-in member view in `packages/core/src/member-view.ts` so "No operation returns a password, hash, salt, or another member's Google email"
- [X] T010 Implement session create, read, and end in `packages/core/src/session.ts` using `packages/core/src/db.ts`, with no expiry column
- [X] T011 Export the public core operations from `packages/core/src/index.ts`
- [X] T012 [P] Read the SQLite file path and Google client id from the environment in `apps/web/src/config.ts`
- [X] T013 [P] Set and clear the persistent `bookclub_session` cookie in `apps/web/src/cookie.ts` (`HttpOnly`, `SameSite=Lax`, `Path=/`, refreshed while signed in, no application timeout)
- [X] T014 [P] Map core failure codes to the sentences in `apps/web/src/messages.ts` using `specs/001-member-registration/contracts/web-pages.md`
- [X] T015 Start a `node:http` server in `apps/web/src/server.ts` that opens the core database from `apps/web/src/config.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Register with a username and password (Priority: P1) MVP

**Goal**: A signed-out person can create a password member and be signed in. Invalid usernames, invalid passwords, and taken usernames create nobody.

**Independent Test**: With no Google account and no website required for the core suite, submit a valid unused username and password and end signed in as a new member (`packages/core/test/register-password.test.ts`).

### Tests for User Story 1

> Write these tests FIRST, ensure they FAIL before implementation

- [X] T016 [P] [US1] Write failing core tests in `packages/core/test/register-password.test.ts` for spec User Story 1 scenarios 1, 2, 3, and 5 (valid registration signs in; any letter case of a taken username is rejected; invalid username or password creates nobody; an existing session returns `already_signed_in`)
- [X] T017 [P] [US1] Write a failing test in `apps/web/test/register-page.test.ts` that the password control is `type="password"` and the submitted password is not shown again

### Implementation for User Story 1

- [X] T018 [P] [US1] Implement username validation in `packages/core/src/username.ts` for "Trimmed display casing the member chose. 3–30 characters. Letters, numbers, hyphens, and underscores. Must start with a letter or number. No spaces after trimming." and "Case-folded username. Unique across all members."
- [X] T019 [P] [US1] Implement password checks and `scrypt` hashing in `packages/core/src/password.ts`. Reject "Missing, shorter than 8 characters, or longer than 128 characters.", "No letter, or no number.", and "The same as the trimmed username, compared without case sensitivity." Store "`scrypt` hash. Never returned by any core operation or page." and "Random salt for that hash. Never returned."
- [X] T020 [US1] Implement `registerWithPassword` in `packages/core/src/register-password.ts`, creating a password member and a session with empty `ended_at`, or returning `username_invalid`, `password_invalid`, `username_taken`, or `already_signed_in` with no new member
- [X] T021 [US1] Implement `GET /register` and `POST /register` in `apps/web/src/register-page.ts` using `packages/core/src/register-password.ts` and `apps/web/src/messages.ts`
- [X] T022 [US1] Route `GET /register` and `POST /register` from `apps/web/src/server.ts`, and set the `bookclub_session` cookie from `apps/web/src/cookie.ts` on success

**Checkpoint**: User Story 1 is functional and testable without Google

---

## Phase 4: User Story 2 - Sign in again with a username and password (Priority: P1)

**Goal**: A password member stays signed in until they sign out, then can sign in again. Wrong attempts stay unlimited and use one message.

**Independent Test**: Starting from a signed-out password member, sign in with those credentials and be recognized as the same member (`packages/core/test/sign-in-password.test.ts`). Seed the member in the test so this story does not need the website register form.

### Tests for User Story 2

> Write these tests FIRST, ensure they FAIL before implementation

- [X] T023 [P] [US2] Write failing core tests in `packages/core/test/sign-in-password.test.ts` for spec User Story 2 scenarios 1 through 5: case-insensitive username match, one `invalid_credentials` result for an unknown username and a wrong password, sign-out, a session that remains open when time passes, and repeated wrong attempts with no counter and no delay
- [X] T024 [P] [US2] Write a failing test in `apps/web/test/session-cookie.test.ts` that a later request still sends `bookclub_session` until `POST /sign-out`

### Implementation for User Story 2

- [X] T025 [US2] Implement `signInWithPassword` in `packages/core/src/sign-in-password.ts`, returning `invalid_credentials` for both an unknown username and a wrong password, running a dummy `scrypt` compare when the username is missing, and storing no attempt count
- [X] T026 [P] [US2] Implement `GET /sign-in` and `POST /sign-in` in `apps/web/src/sign-in-page.ts`
- [X] T027 [P] [US2] Implement `POST /sign-out` and `GET /account` for a password member in `apps/web/src/account-page.ts`, showing "their own username in the casing they chose"
- [X] T028 [US2] Route sign-in, sign-out, and account from `apps/web/src/server.ts`, and refresh the cookie from `apps/web/src/cookie.ts` while `ended_at` is empty

**Checkpoint**: User Stories 1 and 2 both work for password members

---

## Phase 5: User Story 3 - Register by linking a Google account (Priority: P2)

**Goal**: A signed-out person can create a Google member after Google confirms the account, with no username or password. Cancellation creates nobody. A second use of the same Google account is refused without naming the owner.

**Independent Test**: Link an unused verified Google account id and email and end signed in as a new member, without a username or password (`packages/core/test/register-google.test.ts`).

### Tests for User Story 3

> Write these tests FIRST, ensure they FAIL before implementation

- [X] T029 [P] [US3] Write failing core tests in `packages/core/test/register-google.test.ts` for spec User Story 3 scenarios 1, 3, 6, and 7, including "The same person may hold two members by registering once each way. The core does not merge them and does not match a Google email to a username."
- [X] T030 [P] [US3] Write a failing test in `apps/web/test/google-cancel.test.ts` that a cancelled or unverified Google confirmation does not call `registerWithGoogle`

### Implementation for User Story 3

- [X] T031 [US3] Implement `registerWithGoogle` in `packages/core/src/register-google.ts`. A `google` member "has Google id and email, and has no username or password fields." `google_sub` is "Stable Google account id. Unique across all members." A duplicate returns `google_already_linked` and "does not name the member who holds it."
- [X] T032 [P] [US3] Verify the Google ID token audience in `apps/web/src/google.ts` before any core registration call
- [X] T033 [US3] Implement `POST /register/google` in `apps/web/src/google-register-page.ts` using `apps/web/src/google.ts` and `packages/core/src/register-google.ts`
- [X] T034 [US3] Route `POST /register/google` from `apps/web/src/server.ts`, and refuse it with `already_signed_in` when a session is already open

**Checkpoint**: Google registration works, and password registration still works on its own

---

## Phase 6: User Story 4 - Sign in again with a linked Google account (Priority: P2)

**Goal**: A Google member stays signed in until they sign out, then can return by confirming the same Google account. An unknown Google account does not create a member.

**Independent Test**: Starting from a signed-out member who already has a Google link, confirm that same Google account id and be recognized as the same member (`packages/core/test/sign-in-google.test.ts`).

### Tests for User Story 4

> Write these tests FIRST, ensure they FAIL before implementation

- [X] T035 [P] [US4] Write failing core tests in `packages/core/test/sign-in-google.test.ts` for spec User Story 4 scenarios 1 and 2: the same `google_sub` signs in, and a cancelled or unknown Google account does not create a member and stays signed out

### Implementation for User Story 4

- [X] T036 [US4] Implement `signInWithGoogle` in `packages/core/src/sign-in-google.ts`, returning `google_not_linked` without creating a member
- [X] T037 [P] [US4] Implement `POST /sign-in/google` in `apps/web/src/google-sign-in-page.ts`
- [X] T038 [US4] Show only that signed-in member their own Google email on `GET /account` in `apps/web/src/account-page.ts` ("A signed-in Google member can see that the account is connected to Google and can see their own Google email")
- [X] T039 [US4] Route `POST /sign-in/google` from `apps/web/src/server.ts`

**Checkpoint**: All four stories work independently

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Checks that apply across the stories

- [X] T040 [P] Add `packages/core/test/boundary.test.ts` asserting `packages/core/package.json` has no runtime dependencies and `packages/core/src` does not import `node:http`, a web UI framework, or `google-auth-library`
- [X] T041 Confirm `packages/core/src/db.ts` still has no failed-attempt counter, lockout timestamp, or session expiry column
- [X] T042 Run the core suite and the website paths in `specs/001-member-registration/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - Password stories (US1, US2) and Google stories (US3, US4) can then proceed as two tracks
  - Or sequentially in priority order (P1, then P2)
- **Polish (Phase 7)**: Depends on the user stories you intend to ship

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - no dependency on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2). Core tests seed a password member, so they do not need the register page. The website sign-in path uses the same core as US1.
- **User Story 3 (P2)**: Can start after Foundational (Phase 2). Core tests do not need US1. Scenario 7 seeds a password member and asserts Google registration does not modify it.
- **User Story 4 (P2)**: Can start after Foundational (Phase 2). Core tests seed a Google member, so they do not need the Google register page. The website path uses `apps/web/src/google.ts` from US3.

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Validation and hashing before the core operation that stores a member
- Core operation before the website page
- Website page before the route is wired in `apps/web/src/server.ts`
- Story complete before treating the next priority as required

### Parallel Opportunities

- T002, T003, T004, T005, and T006 can run in parallel after T001 is understood
- T008, T009, T012, T013, and T014 can run in parallel; T010 waits on T007
- Once Foundational completes, US1 and US3 core tests can start in parallel
- T016 and T017 can run together; T018 and T019 can run together
- T023 and T024 can run together; T026 and T027 can run together
- T029 and T030 can run together; T032 can run beside T031
- T037 can run beside T036

---

## Parallel Example: User Story 1

```bash
# Tests together:
Task: "Write failing core tests in packages/core/test/register-password.test.ts"
Task: "Write a failing test in apps/web/test/register-page.test.ts"

# Rules together, before registerWithPassword:
Task: "Implement username validation in packages/core/src/username.ts"
Task: "Implement password checks and scrypt hashing in packages/core/src/password.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run `packages/core/test/register-password.test.ts` and `apps/web/test/register-page.test.ts`
5. Demo username-and-password registration if ready

### Incremental Delivery

1. Complete Setup + Foundational
2. Add User Story 1 → test independently → demo (MVP)
3. Add User Story 2 → test independently → password members can leave and return
4. Add User Story 3 → test independently → Google registration
5. Add User Story 4 → test independently → Google return sign-in
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1, then User Story 2
   - Developer B: User Story 3, then User Story 4
3. Stories meet in `apps/web/src/server.ts`; keep route edits sequential within each track

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps a task to a specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate the story independently
- Avoid: vague tasks, same-file conflicts, and cross-story dependencies that break independence
