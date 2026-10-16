# Feature Specification: Choose which book a title means

**Feature Branch**: `008-choose-book-match`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "When a suggested title matches more than one book, let the member pick the one they meant before it is added. One match is added immediately. No match stays as the title text."

## User Scenarios & Testing

### User Story 1 - The suggester picks the matching book (Priority: P1)

A member types a title and presses "Suggest book". If the catalog has several books with a cover for that title, the site shows those books and does not add anything until the member picks one. Each choice shows the cover, the author, and the year when the catalog has them. If the catalog has one book with a cover, that book is added immediately. If it has none, the title is added as text.

**Why this priority**: A shared title can mean different books, and the member is the one who knows which book they meant.

**Independent Test**: Suggest "Born to Run" against a catalog that returns two covered books. The list stays empty until the member adds the second book, and the club then shows that book's cover.

**Acceptance Scenarios**:

1. **Given** a title matches more than one book with a cover, **When** a member suggests that title, **Then** the site asks "Which book did you mean?" and shows each match with its cover, author, and year, and the club list is unchanged.
2. **Given** those matches are shown, **When** the member adds one of them, **Then** the club list gains that title once, with the cover they picked.
3. **Given** a title matches one book with a cover, **When** a member suggests it, **Then** it is added immediately with that cover and no choice is shown.
4. **Given** a title matches no book with a cover, **When** a member suggests it, **Then** it is added as title text and no cover is shown later.
5. **Given** matches are shown, **When** someone submits a cover that was not one of those matches, **Then** nothing is added.
6. **Given** the book search does not respond, **When** a member suggests a title, **Then** nothing is added and the site asks them to try again.
7. **Given** a title is already on the list, **When** a member suggests it again, **Then** the suggestion is refused.

## Requirements

- **FR-001**: Suggesting a title that matches more than one covered book MUST show those matches and MUST NOT add a suggestion until the member picks one.
- **FR-002**: Each match MUST show its cover, and its author and year when the catalog provides them. The member adds one by pressing "Add this book".
- **FR-003**: A title that matches exactly one covered book MUST be added immediately with that cover.
- **FR-004**: A title that matches no covered book MUST be added as title text, with no cover image.
- **FR-005**: The club MUST still keep one suggestion per title. The choice decides which catalog book that suggestion means.
- **FR-006**: A cover that was not offered for that title MUST be refused, and a search that does not respond MUST add nothing.

## Assumptions

- The catalog search still considers the first few title matches, not every book with that title.
- Books from the finished round are unchanged. A suggestion already on the list keeps the cover it already has.
- The member's typed title is what the list stores. The catalog title is only used while they are choosing.
