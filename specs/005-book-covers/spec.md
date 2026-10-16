# Feature Specification: Book Covers

**Feature Branch**: `005-book-covers`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "lets add the book cover feature - if not found then we can just use the text. now sure how we handle multiple books that might have the same title"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A suggestion shows a cover when one can be found (Priority: P1)

When a book is on the suggestion list, the site looks for a cover. If it finds one, the cover is the title: the words are not printed beside it. If it does not, the card shows the title text, the vote count, and the actions, with no image.

**Why this priority**: A cover makes the list easier to scan, and a missing cover must not hide the title.

**Independent Test**: Suggest a well-known title and a made-up title. The known title shows a cover. The made-up title shows the title text and no image.

**Acceptance Scenarios**:

1. **Given** a suggested title matches a published book that has a cover, **When** a member views the list, **Then** that cover is shown and the title is not printed beside it.
2. **Given** a suggested title has no cover, **When** a member views the list, **Then** the title text is shown and no cover image is shown.
3. **Given** several published books share the suggested title, **When** the site chooses a cover, **Then** it shows one cover, the closest match it can find, and does not ask the member to pick an edition.
4. **Given** the club already has a suggestion for a title, **When** someone suggests that same title again, **Then** it is still refused as a duplicate. Cover search does not create a second row.
5. **Given** a cover cannot be retrieved, **When** the list is shown, **Then** the rest of the book card still appears.

---

### Edge Cases

- The club list still has one row per title. Letter case and spacing do not create a second suggestion.
- Different published books with the same title produce one cover, not a choice list.
- A made-up title, or a title with no available cover, stays text.
- A failed lookup does not remove the suggestion, its votes, or who suggested it.
- Signed-out visitors still see no suggestion titles and no covers.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: For each suggested book, the site MUST look for a cover image.
- **FR-002**: When a cover is found, the list MUST show that image and MUST NOT also print the title.
- **FR-003**: When no cover is found, or the cover image cannot be displayed, the list MUST show the title text and MUST NOT show a cover image.
- **FR-004**: When more than one published book has the suggested title, the member who is suggesting it chooses which book to add. That choice is specified in Feature 008.
- **FR-005**: Looking up a cover MUST NOT add a second suggestion for a title the club already has.
- **FR-006**: A missing or failed cover lookup MUST leave the suggestion, its votes, and the suggester tooltip in place.

### Key Entities

- **Book suggestion**: The existing title on the one club list. It may also have a cover image. The cover is a picture of a published book with that title, not a separate suggestion.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After a known book is suggested, a member can see its cover on the list.
- **SC-002**: In a review of titles with no available cover, 100% still show the title text and 0 show a broken or empty image in place of the title.
- **SC-003**: In a review of titles that match more than one published book, each club suggestion shows at most one cover.

## Assumptions

- The club already refuses a second suggestion whose title matches an existing one except for letter case or spacing. This feature does not change that rule.
- "Multiple books with the same title" means different published books or editions in the catalog, not two rows on the club list.
- Choosing among several catalog books with the same title is specified in Feature 008. This feature still stores one cover on the one suggestion for that title.
- If the lookup cannot be completed, the card stays text and a later view may try again.
- Voting, removal, and the suggester tooltip stay as they are.
