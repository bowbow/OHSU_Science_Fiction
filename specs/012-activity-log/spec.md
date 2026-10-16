# Feature Specification: Activity Log

**Feature Branch**: `012-activity-log`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "Keep a log of important events such as a user signing in, suggesting a book, or voting for a book. Do not log noise, and write each event so it can be read without deciphering it."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The operator can read what members did (Priority: P1)

The person who runs the site can read a record of the club actions that matter. Each entry is one plain sentence that names the member and what they did. The record is not shown to members on the site.

**Why this priority**: The operator asked for a readable history of sign-ins, suggestions, and votes.

**Independent Test**: A member registers, signs out, signs in, suggests a book, and votes for it. The record contains one sentence for each of those actions, in that order, and does not contain the password.

**Acceptance Scenarios**:

1. **Given** a new member registers, **When** the account is created, **Then** the record gains one line: `{time}  {username} registered`.
2. **Given** a member signs in with the right password, **When** the sign-in succeeds, **Then** the record gains one line: `{time}  {username} signed in`.
3. **Given** a signed-in member signs out, **When** the sign-out succeeds, **Then** the record gains one line: `{time}  {username} signed out`.
4. **Given** suggestions are open, **When** a member suggests a book, **Then** the record gains one line: `{time}  {username} suggested "{title}"`.
5. **Given** a member has not voted, **When** they vote for a book, **Then** the record gains one line: `{time}  {username} voted for "{title}"`.
6. **Given** a member has already voted for a different book, **When** they vote for another book, **Then** the record gains one line: `{time}  {username} moved their vote to "{title}"`.
7. **Given** a member removes a book they suggested, **When** the removal succeeds, **Then** the record gains one line: `{time}  {username} removed "{title}"`.
8. **Given** an admin removes a book someone else suggested, **When** the removal succeeds, **Then** the record gains one line: `{time}  {username} removed "{title}", which {suggester} suggested`.
9. **Given** suggestions are not open and no book is selected, **When** an admin opens the club for suggestions, **Then** the record gains one line: `{time}  {username} opened the club for book suggestions`.
10. **Given** one book is ahead, **When** an admin closes the call and that book is selected, **Then** the record gains one line: `{time}  {username} chose "{title}" as the book the club will read`. Choosing a tied book uses the same sentence.
11. **Given** the call is closed with no books, **When** that succeeds, **Then** the record gains one line: `{time}  {username} closed suggestions and no book was selected`.
12. **Given** a book has been selected, **When** an admin starts a new book, **Then** the record gains one line: `{time}  {username} started a new book`.

---

### User Story 2 - The operator can read meeting decisions (Priority: P1)

After a book is selected, meeting proposals, attendance votes, corrections, and the chosen meeting are recorded in the same record, using the same clock time the site shows.

**Why this priority**: Meeting choices are part of the same club history as book choices.

**Independent Test**: An admin proposes a time, a member votes for it and then withdraws that vote, the admin removes a mistaken time, and the admin chooses a meeting. Each of those actions adds one sentence.

**Acceptance Scenarios**:

1. **Given** a book is selected, **When** an admin proposes a meeting time, **Then** the record gains one line: `{time}  {username} proposed {meeting}`.
2. **Given** a meeting time is proposed, **When** a member votes for it, **Then** the record gains one line: `{time}  {username} voted to meet on {meeting}`.
3. **Given** a member has voted for a meeting time, **When** they withdraw that vote, **Then** the record gains one line: `{time}  {username} withdrew their vote for {meeting}`.
4. **Given** a meeting time has not been chosen, **When** an admin removes it, **Then** the record gains one line: `{time}  {username} removed the meeting time {meeting}`.
5. **Given** a meeting time is chosen, **When** the admin selects it, **Then** the record gains one line: `{time}  {username} chose {meeting} as the meeting`.

`{meeting}` is the same wording the site already shows, such as `Thursday, October 15, 2026 at 7:00 PM`.

---

### User Story 3 - The record stays quiet, private, and kept (Priority: P2)

The operator does not have to skip failed attempts, page visits, or secrets. Members cannot read the record on the site. Replacing the application does not erase the record.

**Why this priority**: A noisy or lost record would not answer the request.

**Independent Test**: A wrong password, a repeated vote for the same book, a page visit, and a health check add no lines. The password never appears. A member viewing the site cannot see the record. Earlier lines are still there after a new release is deployed.

**Acceptance Scenarios**:

1. **Given** a sign-in uses the wrong password, **When** it is refused, **Then** no line is added.
2. **Given** a member votes again for the book they already voted for, **When** the counts do not change, **Then** no line is added.
3. **Given** a member votes again for a meeting time they already voted for, **When** the count does not change, **Then** no line is added.
4. **Given** a member withdraws a meeting vote they do not have, **When** nothing changes, **Then** no line is added.
5. **Given** suggestions are already open, **When** an admin opens them again, **Then** no line is added.
6. **Given** a title matches several catalog books, **When** the member is asked which one they mean and has not picked yet, **Then** no line is added. The suggestion line is added only when the book is actually added, and it uses the title the member typed.
7. **Given** any recorded action, **When** the operator reads the record, **Then** it does not contain a password or a session identifier.
8. **Given** a person is signed in as a member, **When** they use the site, **Then** the site does not show them the activity record.
9. **Given** the record already has lines, **When** a new application release is deployed, **Then** those lines remain.

### Edge Cases

- A book title is stored and logged as the member typed it, including spaces. The title is wrapped in quotation marks.
- An admin who removes a book they themselves suggested gets the shorter removal sentence, without "which {suggester} suggested".
- Signing out when nobody is signed in adds no line.
- Every `{time}` is a UTC clock time, written `YYYY-MM-DD HH:MM:SS UTC`, even when the server's local clock uses another zone. Two spaces separate `UTC` from the sentence.
- A line is added only after the action succeeds. A refused action adds nothing.
- If the record cannot be saved, the member's action still succeeds.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST append one line for each successful action listed in User Stories 1 and 2, using that story's sentence.
- **FR-002**: Each line MUST begin with the UTC time `YYYY-MM-DD HH:MM:SS UTC`, then two spaces, then the sentence. Example: `2026-10-07 17:25:03 UTC  bow signed in`.
- **FR-003**: The record MUST use the member's display name and the book title as stored. A meeting time MUST use the same wording the site shows to members.
- **FR-004**: The record MUST NOT gain a line for a refused action, a page visit, a health check, a repeated vote that changes nothing, a meeting-vote withdrawal that changes nothing, opening suggestions that are already open, or a catalog choice that has not yet added a book.
- **FR-005**: The record MUST NOT contain passwords or session identifiers.
- **FR-006**: Club members MUST NOT be able to read the activity record through the site.
- **FR-007**: The record MUST be kept with the club's saved data so that deploying a new release does not erase it.
- **FR-008**: The same lines MUST also be available to the person watching the running site.
- **FR-009**: Failure to write the record MUST NOT undo or block the member's action.

### Key Entities

- **Activity line**: One successful club action. It has a UTC time and one sentence naming the member and the action. Lines are kept in order, newest at the end. They are not part of the member-facing club pages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An operator can tell who did what from a single line, without a code book, for every action listed in User Stories 1 and 2.
- **SC-002**: In a session that includes a wrong password, a repeated unchanged vote, and a page visit, those three add zero lines, and the password does not appear anywhere in the record.
- **SC-003**: After a new release is deployed, every activity line written before that deployment is still present.
- **SC-004**: A signed-in member cannot open the activity record from any site page.

## Assumptions

- The reader of the record is the person operating the site, not a club member.
- There is one activity record for the one club.
- Failed sign-ins and other refusals are omitted on purpose. The operator asked for important events without noise.
- Times are recorded in UTC and labeled `UTC`.
- The suggestion sentence uses the title the member typed, not a different catalog title.
- Seeded admin accounts are not written to the record merely because the site started.
