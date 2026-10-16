# Feature Specification: Choose a meeting time

**Feature Branch**: `009-choose-meeting-time`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "After a book is selected, an admin proposes several dates and times. Members vote for every time they can attend. The admin presses Date selected, and the most popular time becomes the meeting. A tie waits for the admin to choose. The chosen time stays until the club starts over."

## User Scenarios & Testing

### User Story 1 - The club picks a meeting time (Priority: P1)

After a book has been selected, an admin proposes one or more meeting times. Signed-in members vote for every time they can attend. Each time shows its vote count, and the list puts the most votes first. The admin presses "Date selected" when one time is ahead. When several times share the highest count, the admin chooses among those times. A time with fewer votes cannot be chosen. After the meeting time is chosen, a signed-in member sees the book and the meeting time, and that time stays until an admin starts over.

**Why this priority**: The club needs a meeting time after it knows which book it will read.

**Independent Test**: With a selected book and two proposed times, one member votes for both and another votes for only the first. "Date selected" locks the first time. A regular member then sees that book and that meeting time.

**Acceptance Scenarios**:

1. **Given** a book has been selected and no meeting time has been chosen, **When** an admin clicks an open day on the calendar and enters a time, **Then** that time appears on the calendar at 0 votes. A regular member cannot propose a time.
2. **Given** meeting times are proposed, **When** a member votes, **Then** they can vote for every time they can attend, each vote is counted, and the times are ordered with the most votes first. Clicking a proposed day on the calendar votes for that time. Clicking that day again removes the vote. The day is green while their vote is on it, and navy when it is not. The day shows how many votes that time has.
3. **Given** a member has voted for a time, **When** they remove that vote, **Then** the count goes down and their vote is no longer marked.
4. **Given** an admin proposed a time by mistake, **When** they remove it before a meeting time is chosen, **Then** that time and its votes leave the list.
5. **Given** one time has strictly the most votes, **When** an admin presses "Date selected", **Then** that time becomes the meeting time.
6. **Given** two or more times share the highest vote count, **When** an admin presses "Date selected", **Then** no meeting time is chosen until the admin chooses one of those times. A time with fewer votes cannot be chosen.
7. **Given** a meeting time has been chosen, **When** a regular member or an admin signs in, **Then** they see which book will be read and the sentence "The book club will meet on {time}." Voting, proposing, and removing times stop.
8. **Given** a meeting time has been chosen, **When** an admin starts over, **Then** the meeting time is cleared with the book and the suggestions.
9. **Given** meeting times have been proposed, **When** a signed-in member views the club, **Then** a calendar sits to the right of the chosen book and marks the days that have a proposed time. A regular member does not see a separate date list. Until that member has voted for a time, they see "Click each day you can attend." An admin still sees the list so they can remove a time or choose the meeting. An admin votes on the calendar, and that list has no vote button.

## Requirements

- **FR-001**: After a book is selected and before a meeting time is chosen, an admin MUST be able to propose a time by clicking an open day on the calendar and entering the clock time. A regular member MUST NOT propose one.
- **FR-002**: A signed-in member MUST be able to vote for every proposed time they can attend, and MUST be able to remove their own vote from a time, including by clicking that day on the calendar. Clicking a day they already voted for MUST remove that vote. An admin votes the same way on the calendar, and an admin's vote counts the same way. The admin list MUST NOT include a vote button.
- **FR-003**: An admin's list MUST show each time's vote count and MUST order the times with the most votes first. Equal counts keep the earlier proposal first. A calendar MUST sit to the right of the chosen book, mark each day that has a proposed time, show that time's vote count on the day, and show a day in green while the signed-in member's vote is on it. A day without their vote stays navy. A regular member MUST NOT see that date list. Until a regular member has voted for a time, the page MUST say "Click each day you can attend."
- **FR-004**: An admin MUST be able to remove a proposed time, and its votes, before a meeting time is chosen.
- **FR-005**: "Date selected" MUST choose the time with strictly the most votes. When more than one time shares the highest count, the admin MUST choose among those times. A time with fewer votes MUST NOT be selectable.
- **FR-006**: After a meeting time is chosen, signed-in members MUST see the selected book and "The book club will meet on {time}." The time MUST stay fixed until an admin starts over.
- **FR-007**: Starting over MUST clear the proposed times, their votes, and the chosen meeting time along with the selected book.

## Assumptions

- A meeting time is a calendar date and a clock time, shown as the admin entered it.
- The same date and time cannot be proposed twice.
- Proposing a time, voting, and removing a time are available only after a book is selected and before a meeting time is chosen.
- There is still exactly one book club.
