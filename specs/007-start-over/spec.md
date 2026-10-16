# Feature Specification: Start the next round

**Feature Branch**: `007-start-over`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "Once a book has been chosen and read, an admin can start over. The same book club opens for suggestions again with an empty list."

## User Scenarios & Testing

### User Story 1 - An admin starts the next round (Priority: P1)

After a book has been selected, an admin can press "Start a new book" in the left column. The chosen book, the suggestion list, and the votes are cleared. The same book club is open for suggestions again, with no books on the list. A regular member does not see "Start a new book" and still sees the chosen book until an admin presses it.

**Why this priority**: The club needs a way to begin another round after it has finished reading the selected book.

**Independent Test**: An admin selects a book, presses "Start over", and a regular member then sees an open club with no suggested books and can suggest a title again.

**Acceptance Scenarios**:

1. **Given** a book has been selected, **When** an admin views the book club, **Then** they see "The book club will read {title}." and can press "Start a new book" in the left column. A regular member sees the same sentence and book, and cannot press "Start a new book".
2. **Given** a book has been selected, **When** an admin presses "Start a new book", **Then** they are asked to confirm. The message says that starting over clears the chosen book, the suggestions, the votes, and the meeting time, and opens suggestions with an empty list. **No** leaves the club unchanged. **Yes** opens the same book club for suggestions, with no book selected and an empty suggestion list.
3. **Given** an admin has started over, **When** a member suggests a title that was suggested in the previous round, **Then** the suggestion is accepted and that book starts at 0 votes.
4. **Given** no book has been selected, **When** someone tries to start over, **Then** the change is refused.
5. **Given** a book has been selected, **When** a regular member tries to start over, **Then** the change is refused.

## Requirements

- **FR-001**: After a book has been selected, a signed-in admin MUST be able to press "Start a new book" in the left column. A regular member MUST NOT see or use that action.
- **FR-002**: Starting over MUST keep the same book club, clear the selected book, clear every suggestion and vote from that round, clear any proposed or chosen meeting time, and open the club for suggestions with an empty list.
- **FR-003**: Starting over MUST be refused when no book has been selected, including while suggestions are open and when the call was closed with an empty list.
- **FR-004**: Until an admin starts over, signed-in members MUST continue to see "The book club will read {title}." and that book alone.
- **FR-005**: Pressing "Start a new book" MUST ask for confirmation before anything is cleared. The choices are "Yes" and "No". "No" MUST leave the club unchanged.

## Assumptions

- Books from the finished round are not kept.
- "Open for book suggestions" remains the action for a club that was closed without a selected book. It does not clear a selected book.
- There is still exactly one book club.
