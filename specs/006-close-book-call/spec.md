# Feature Specification: Close the call for new books

**Feature Branch**: `006-close-book-call`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "As an admin user I would like to Close the call for new books. I should be able to do that by pressing a button and the book with the most votes becomes the winner (the book that will actually be read). At this point, when a regular user logs in they will see a message saying which book has been selected and it will be shown as a single tile."

## User Scenarios & Testing

### User Story 1 - An admin closes the call and a book is selected (Priority: P1)

While the book club is open for suggestions, an admin can press "Close the call for new books". The book with the most votes becomes the book the club will read. A signed-in member then sees that book named in a sentence and shown once, as a single tile. Suggesting, voting, and removing stop.

**Why this priority**: Closing the call is how the club chooses the book it will actually read.

**Independent Test**: With two suggested books and unequal votes, an admin closes the call. A regular member signs in and sees only the leading book, named in a sentence, on one tile.

**Acceptance Scenarios**:

1. **Given** the book club is open for suggestions, **When** an admin views the book club, **Then** they can press "Close the call for new books". A regular member cannot.
2. **Given** suggested books have different vote counts, **When** an admin closes the call, **Then** the book with the most votes is selected and the call is no longer open.
3. **Given** two or more books share the highest vote count, **When** an admin closes the call, **Then** no book is selected until the admin chooses one of those books.
4. **Given** a book has been selected, **When** a regular member or an admin signs in, **Then** they see "The book club will read {title}." and that book alone, as one tile, with no suggest form, vote button, or remove button.
5. **Given** a book has been selected, **When** someone tries to suggest, vote, remove a book, or press "Open for book suggestions", **Then** the change is refused.
6. **Given** the call is open and no books have been suggested, **When** an admin closes the call, **Then** no book is selected and the page says "No book was selected."

## Requirements

- **FR-001**: While suggestions are open, a signed-in admin MUST be able to close the call by pressing "Close the call for new books". A regular member MUST NOT be able to close it.
- **FR-002**: Closing the call MUST select the suggested book when it has strictly the most votes. When more than one book shares the highest count, the call MUST stay open until the admin chooses one of those books. A book with fewer votes MUST NOT be selectable.
- **FR-003**: Closing the call when no books have been suggested MUST select nothing.
- **FR-004**: After a book is selected, a signed-in member MUST see the sentence "The book club will read {title}." and that book once, as a single tile.
- **FR-005**: After the call is closed, the site MUST NOT accept a new suggestion, a vote, or a removal. Once a book has been selected, "Open for book suggestions" MUST NOT open the club again. Starting a new round is specified in Feature 007.

## Assumptions

- This feature does not add a way to pick a different book afterward. Starting a fresh round after the club has a selected book is specified in Feature 007.
- Equal vote counts are not resolved by the site. The admin chooses among the books that share the highest count.
- An admin sees the same selected-book message and tile as a regular member.
- The tile uses the cover when one is stored, and the title text when there is no cover. Vote and Remove are not on the tile.
- "No book was selected." is shown when the call was closed with an empty list. An admin can open suggestions again only in that case.
