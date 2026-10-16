# Feature Specification: Remove Book Suggestions

**Feature Branch**: `003-remove-book-suggestions`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "Lets add a way for users to delete/remove a book they have previously suggested. They should not be able to do this for books suggested by other users. Admins can delete/remove any book suggested by anybody"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A member removes their own suggestion (Priority: P1)

A signed-in member who suggested a book can remove that book from the club's list. The book disappears for everyone. Books suggested by other people stay.

**Why this priority**: Members need a way to take back a suggestion they no longer want on the list.

**Independent Test**: A regular member suggests a title, removes it, and sees it gone. A title suggested by someone else is still listed and has no remove action for this member.

**Acceptance Scenarios**:

1. **Given** a regular member suggested a book, **When** they remove it, **Then** that book is no longer on the list for any signed-in member.
2. **Given** a member suggested more than one book, **When** they remove one of them, **Then** only that book is removed and their other suggestions stay.
3. **Given** a book was suggested by someone else, **When** a regular member views the list, **Then** they are not offered a way to remove that book.
4. **Given** a regular member tries to remove a book suggested by someone else, **When** the site handles that attempt, **Then** the book stays and they are told they can only remove a book they suggested.
5. **Given** a member removes a book, **When** anyone suggests that same title again, **Then** the title can be added to the list again.
6. **Given** a person is signed out, **When** they try to remove a book or view the list, **Then** they see no book titles and are asked to sign in.

---

### User Story 2 - An admin removes any suggestion (Priority: P1)

An admin can remove any book on the list, including books they suggested and books suggested by regular members or other admins.

**Why this priority**: The request gives admins the ability to remove a suggestion no matter who added it.

**Independent Test**: An admin removes a book suggested by a regular member. That book leaves the list. The admin can also remove a book they suggested themselves.

**Acceptance Scenarios**:

1. **Given** a regular member suggested a book, **When** an admin removes it, **Then** that book is no longer on the list.
2. **Given** an admin suggested a book, **When** that admin removes it, **Then** that book is no longer on the list.
3. **Given** the list has several books, **When** an admin views it, **Then** every book offers a way to remove it.
4. **Given** a book was already removed, **When** a member or admin tries to remove it again, **Then** the list is unchanged and they are told that book is no longer on the list.

---

### Edge Cases

- Removing a book does not remove any other book.
- A regular member never receives a remove action for another person's book. Submitting such a removal anyway does not delete the book.
- An admin can remove their own suggestion and anyone else's.
- After a title is removed, it is no longer treated as already suggested.
- A second attempt to remove the same book does not change the list.
- Signed-out visitors never see suggestion titles and cannot remove a book.
- This feature does not add voting, meetings, discussion, or a way to leave "Open for book suggestions".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A signed-in member MUST be able to remove a book they previously suggested.
- **FR-002**: Removing a book MUST take it off the one shared list for every member.
- **FR-003**: A regular member MUST NOT be able to remove a book suggested by someone else.
- **FR-004**: A regular member MUST NOT be offered a remove action for a book suggested by someone else.
- **FR-005**: An admin MUST be able to remove any suggested book, whoever suggested it.
- **FR-006**: An admin MUST be offered a remove action for every book on the list.
- **FR-007**: Removing one book MUST leave every other suggestion on the list.
- **FR-008**: After a book is removed, the same title MUST be allowed as a new suggestion.
- **FR-009**: A signed-out person MUST NOT see suggestion titles and MUST NOT be able to remove a book.
- **FR-010**: If the book is already gone, the site MUST leave the list unchanged and MUST say that the book is no longer on the list.

### Key Entities

- **Book suggestion**: A title already on the one book club's list, tied to the member who suggested it. This feature removes that suggestion. It does not change who may suggest a book.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A member can remove a book they suggested and see it gone from the list in under 1 minute.
- **SC-002**: In a review of removal attempts, 100% of books removed by their suggester or by an admin are absent from the list afterward, and 100% of other books remain.
- **SC-003**: In a review of removal attempts by regular members, 0 books suggested by someone else are removed.
- **SC-004**: In a review of what a signed-out visitor can see, 0 suggestion titles are visible.

## Assumptions

- This feature uses the one book club and the suggestion list from open book suggestions. Feature 002 keeps a suggestion until a later feature removes it. This is that feature.
- "Delete" and "remove" mean the same action: the suggestion leaves the list. There is no separate archive and no confirmation step beyond the remove action itself.
- Pointing at a title shows the username of the member who suggested it. A remove action is shown beside a book only when the signed-in member is allowed to remove it.
- A removed title may be suggested again by any signed-in member while the club is open for book suggestions.
- Admins remain bow and pamela, plus the rule that everyone who registers is a regular member.
- Voting, choosing a book, meetings, discussion, and leaving "Open for book suggestions" stay out of scope.
