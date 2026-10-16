# Feature Specification: Open Book Suggestions

**Feature Branch**: `002-open-book-suggestions`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "admins can control the life-cycle of the book club. Here are some of the things only they can do: 1) open a new bookclub for suggestions of books. Once the book club is in this state, when a regular user logs in they can then suggest books that can be read by the club. The site must remember this list of books."

## Clarifications

### Session 2026-10-05

- Q: When an admin opens a book club for suggestions, is that one shared club at a time, or can several clubs collect books at once? → A: There is only one book club. After sign-in, an admin sees its current state and can set that state to "Open for book suggestions". Admins and regular members can both add books while it is in that state. A regular member sees that state, the books suggested so far, and can add to that same list.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - An admin opens suggestions (Priority: P1)

There is one book club. After an admin signs in, they see its current state and can set that state to "Open for book suggestions". Until an admin does that, nobody can suggest a book.

**Why this priority**: Suggestions only exist after an admin opens the club. This is the step the request names as an admin-only action.

**Independent Test**: An admin signs in, sees the current state, and sets it to "Open for book suggestions". A regular member cannot change that state, and before the admin opens it a member cannot add a book.

**Acceptance Scenarios**:

1. **Given** the book club is not open for book suggestions, **When** an admin signs in, **Then** they see the current state and can set it to "Open for book suggestions".
2. **Given** an admin sets the book club to "Open for book suggestions", **When** the book club page is shown, **Then** the state reads "Open for book suggestions" and any books already suggested are still on the list.
3. **Given** a regular member is signed in, **When** they try to change the book club state, **Then** the state stays the same and they are told that only an admin can do that.
4. **Given** the book club is not open for book suggestions, **When** a signed-in member tries to suggest a book, **Then** the book is not saved and they are told that suggestions are not open.
5. **Given** a person is signed out, **When** they try to open suggestions or view the suggestion list, **Then** they see no book titles and are asked to sign in.

---

### User Story 2 - Members suggest books (Priority: P1)

While the book club state is "Open for book suggestions", a signed-in admin or regular member can suggest a book by its title. After sign-in they see that state, the books suggested so far, and can add to that same list. The site keeps the list.

**Why this priority**: Remembering the books members suggest is the outcome the request asks for.

**Independent Test**: After an admin has set the state to "Open for book suggestions", a regular member signs in, sees that state and the current list, and adds a title. An admin can add a title too. After signing out and back in, both titles are still on the one list.

**Acceptance Scenarios**:

1. **Given** the book club state is "Open for book suggestions", **When** a regular member signs in, **Then** they see that state, the books suggested so far, and a way to add a book.
2. **Given** the book club state is "Open for book suggestions", **When** a regular member suggests a book title, **Then** the title is added to the one list and pointing at the title shows that member as the person who suggested it.
3. **Given** the book club state is "Open for book suggestions", **When** an admin suggests a book title, **Then** the title is added to the same list and pointing at the title shows that admin as the person who suggested it.
4. **Given** a book has been suggested, **When** any signed-in member points at the title, **Then** they see who suggested it.
5. **Given** a title is already on the list, **When** someone suggests that same title in any letter case, or with different spacing at the ends or between words, **Then** no second copy is saved and they are told that the book is already on the list.
6. **Given** a member submits a blank title, **When** they try to suggest it, **Then** no book is saved and they are asked for a title.
7. **Given** a member has suggested a book, **When** they sign out and later sign in again, **Then** the book is still on the list.

---

### Edge Cases

- There is one book club. Setting its state to "Open for book suggestions" does not create a second club and does not remove books already suggested.
- A book is remembered as the title the member typed, with extra spaces at the ends and between words collapsed, and the casing they used is kept.
- Two people suggesting the same new title at the same time produce one list entry. The other person is told the book is already on the list.
- An admin or a regular member may suggest more than one different book while the state is "Open for book suggestions".
- Signed-out visitors never see suggestion titles.
- Other book-club stages, such as voting, choosing a winner, or scheduling a meeting, are not part of this feature. This feature does not include a way to leave the state "Open for book suggestions".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: An admin who is signed in MUST see the one book club's current state and MUST be able to set that state to "Open for book suggestions".
- **FR-002**: A regular member MUST NOT be able to change the book club state.
- **FR-003**: Before the state is "Open for book suggestions", the site MUST NOT save a suggested book.
- **FR-004**: While the state is "Open for book suggestions", a signed-in regular member MUST be able to suggest a book by entering its title.
- **FR-005**: While the state is "Open for book suggestions", a signed-in admin MUST be able to suggest a book by entering its title, on the same list as regular members.
- **FR-006**: The site MUST remember every accepted suggestion on that one book club, including the title and which member suggested it, until a later feature explicitly removes it.
- **FR-007**: After sign-in, a member MUST see the book club's current state. While the state is "Open for book suggestions", they MUST see the books suggested so far and a way to add a book. Pointing at a title MUST show who suggested it.
- **FR-008**: A signed-out person MUST NOT see suggestion titles.
- **FR-009**: The site MUST treat two titles as the same book when they differ only by letter case or by spaces at the ends or between words. A duplicate suggestion MUST be refused.
- **FR-010**: The site MUST refuse a suggestion whose title is empty after spaces are removed.
- **FR-011**: There MUST be only one book club. Setting its state to "Open for book suggestions" MUST NOT create another club and MUST NOT remove books already suggested.

### Key Entities

- **Book club**: The one club on the site. It has a current state. In this feature an admin can set that state to "Open for book suggestions".
- **Book suggestion**: A title a signed-in member offers for the club to read, tied to the one book club and to the member who suggested it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An admin can open suggestions in under 1 minute.
- **SC-002**: After sign-in, a member can see the book club state, and when suggestions are open can add a book and see it on the list, in under 1 minute.
- **SC-003**: In a review of saved suggestions, 100% of accepted titles are still present after the member signs out and signs in again.
- **SC-004**: In a review of refused attempts, 100% of duplicate titles and blank titles add no extra book.
- **SC-005**: In a review of what a signed-out visitor can see, 0 suggestion titles are visible.

## Assumptions

- This feature uses the members from member registration. Admins are bow and pamela. Everyone who registers is a regular member.
- There is one book club, not many named clubs and not a series of separate rounds.
- A suggestion is a title only. Author, a link, a description, and a vote are out of scope.
- The member who suggested a book is identified by their username. That username appears when a member points at the title, and it is not printed under the title.
- Signed-in admins and signed-in regular members may both read the list and add to it while the state is "Open for book suggestions". Only an admin can set that state.
- This feature does not include a way to leave "Open for book suggestions". Voting, picking a book to read, meetings, and discussion are out of scope.
- The suggestion list is visible only to signed-in members.
- After registration or sign-in, the member lands on the book club page. The account page remains available from the left column.
