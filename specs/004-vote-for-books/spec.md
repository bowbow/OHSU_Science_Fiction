# Feature Specification: Vote for a Book

**Feature Branch**: `004-vote-for-books`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "all users should also be able to vote for a book. they have exactly 1 vote that they can cast. They can change their mind as many times as they like. If they have already voted for BookA and now vote for BookB, then their vote for BookA is removed and a vote for bookB is added. All books start with zero votes. The number of votes for each book should be shown. The order of the books shown should be with the most voted at the top."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A member casts their one vote (Priority: P1)

Every signed-in member, regular or admin, can vote for one suggested book. Every book starts with zero votes. The list shows each book's vote count, with the most votes at the top.

**Why this priority**: Choosing a book starts with seeing how many votes each suggestion has and placing one vote.

**Independent Test**: Two books are suggested. Both show zero votes, in the order they were suggested. A member votes for the later book. That book shows one vote and moves above the other.

**Acceptance Scenarios**:

1. **Given** books have been suggested and nobody has voted, **When** a member views the list, **Then** every book shows zero votes.
2. **Given** a member has not voted, **When** they vote for a book, **Then** that book gains one vote and every other book keeps its count.
3. **Given** a member has not voted, **When** they view the list, **Then** they can vote for any suggested book, including one they suggested and one someone else suggested.
4. **Given** an admin and a regular member both vote for the same book, **When** the list is shown, **Then** that book shows two votes.
5. **Given** books have different vote counts, **When** the list is shown, **Then** the book with the most votes is first.
6. **Given** two books have the same number of votes, **When** the list is shown, **Then** the one suggested earlier is listed first.
7. **Given** a person is signed out, **When** they try to vote or view the list, **Then** they see no book titles and are asked to sign in.

---

### User Story 2 - A member moves their vote (Priority: P1)

A member has exactly one vote. They may move it as many times as they like. Voting for a different book takes the vote off the previous book and places it on the new one.

**Why this priority**: The request says a change of mind replaces the earlier vote rather than adding a second one.

**Independent Test**: A member votes for Book A, then votes for Book B. Book A returns to its previous count, Book B gains that one vote, and the member still has only one vote.

**Acceptance Scenarios**:

1. **Given** a member has voted for Book A, **When** they vote for Book B, **Then** Book A loses that vote and Book B gains it.
2. **Given** a member has voted for a book, **When** they vote for that same book again, **Then** the counts stay the same.
3. **Given** a member has voted, **When** they view the list, **Then** the book that holds their vote is marked as their vote.
4. **Given** a member moves their vote several times, **When** they stop, **Then** exactly one book holds their vote.
5. **Given** a book that has votes is removed, **When** the list is shown, **Then** that book's votes are gone and each member who had voted for it may vote again.

---

### Edge Cases

- A new suggestion starts at zero votes.
- One member never adds more than one vote, even by voting again.
- Moving a vote does not change anyone else's vote.
- Equal counts keep the earlier suggestion above the later one.
- Removing a book removes only the votes on that book.
- Signed-out visitors never see titles, counts, or a way to vote.
- This feature does not choose a winning book, close suggestions, schedule a meeting, or add discussion.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every signed-in member MUST be able to vote for a suggested book.
- **FR-002**: Each member MUST have at most one vote on the list at a time.
- **FR-003**: A member who has not voted MUST be able to place that vote on any suggested book.
- **FR-004**: When a member who voted for one book votes for another, the first book MUST lose that vote and the second book MUST gain it.
- **FR-005**: A member MUST be able to move their vote any number of times.
- **FR-006**: Voting again for the book that already holds the member's vote MUST leave every count unchanged.
- **FR-007**: Every suggested book MUST start with zero votes.
- **FR-008**: The list MUST show the number of votes for each book.
- **FR-009**: The list MUST show the book with the most votes first. When counts are equal, the book suggested earlier MUST come first.
- **FR-010**: The book that holds the signed-in member's vote MUST be marked as their vote.
- **FR-011**: A signed-out person MUST NOT see suggestion titles or vote counts and MUST NOT be able to vote.
- **FR-012**: Removing a suggested book MUST remove the votes on that book, and each member who had voted for it MUST be able to vote again.

### Key Entities

- **Vote**: The one choice a signed-in member has placed on a suggested book. A member has at most one vote. A book has a count of those votes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A member can vote for a book and see its new count and the updated order in under 1 minute.
- **SC-002**: In a review of members who have voted, 100% have their vote on exactly one book.
- **SC-003**: In a review of a vote that moved from one book to another, the first book's count drops by one and the second book's count rises by one.
- **SC-004**: In a review of the list, 100% of books show a vote count, and the counts descend from the top, with earlier suggestions first when counts match.
- **SC-005**: In a review of what a signed-out visitor can see, 0 suggestion titles and 0 vote counts are visible.

## Assumptions

- "All users" means every signed-in member, both regular members and admins. A signed-out visitor cannot vote.
- A member starts with no vote cast. There is no separate action to withdraw a vote without choosing another book.
- An admin's vote counts the same as a regular member's vote.
- The list order from open book suggestions, which was oldest first, is replaced by this vote order.
- The member can see which book currently holds their vote, so they can move it.
- Voting does not close suggestions, pick a winner, or add meetings or discussion.
