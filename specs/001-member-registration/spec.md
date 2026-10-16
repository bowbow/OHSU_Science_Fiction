# Feature Specification: Member Registration

**Feature Branch**: `001-member-registration`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "a book club member should be able to register with the site by supplying a username and password. Alternatviely the user should be able to link their google account to the book club site (and later use those credentials to log in)"

## Clarifications

### Session 2026-10-05

- Q: Should a member be able to register or sign in with Google? → A: No. Google registration and Google sign-in are removed. A member registers and signs in with a username and password only.
- Q: How long should a member stay signed in before they have to sign in again? → A: Until they sign out, with no time limit.
- Q: What should happen after repeated wrong sign-in attempts? → A: Any number of attempts is allowed. No lockout or slowdown. An admin password reset may be added in a later feature.
- Q: What password rules should registration enforce? → A: None. Any string of any length is accepted.
- Q: What title should the site header show? → A: Welcome to the Bookclub
- Q: How should the signed-in site be arranged? → A: A left column of options with the member's name at the top, and a main area that shows the selected option. After registration or sign-in, the member lands on the book club page in that arrangement. The account page remains available from the left column.
- Q: What kinds of members are there? → A: Regular members and admin members. The site starts with two admins, bow and pamela, both with the password admin. Everyone who registers is a regular member. Admin actions, such as resetting a password, are still a later feature.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register with a username and password (Priority: P1)

A person who is new to the book club site creates a member account by choosing a username and a password. When the details are accepted, the site signs them in as that member.

**Why this priority**: A username and password is the primary way the request says a member joins the site. Without it, there is no member account to return to.

**Independent Test**: A person who is not yet a member can submit a valid unused username and a valid password, and ends signed in as a new member.

**Acceptance Scenarios**:

1. **Given** a person is not a member and is not signed in, **When** they submit an unused valid username and a valid password, **Then** a regular member account is created and they are signed in as that member.
2. **Given** a username is already taken, **When** another person submits that username in any letter case with a valid password, **Then** no new member is created and they are told that the username is already taken.
3. **Given** a person submits a username that is missing, shorter than 3 characters, longer than 30 characters, contains a space or a character other than letters, numbers, hyphens, and underscores, or does not start with a letter or number, **When** they try to register, **Then** no member is created and they are told what to correct.
4. **Given** a person submits an unused valid username and any password string, including one that is empty, short, long, has no number, or matches the username, **When** they register, **Then** a member account is created and they are signed in.
5. **Given** a person is choosing a password, **When** they enter it, **Then** the password stays hidden while they type and is never shown again after they submit it.
6. **Given** a person is already signed in, **When** they try to register again with a username and password, **Then** no second member is created and their sign-in method stays the same.
7. **Given** a person opens any page, **When** the page is shown, **Then** the header reads "Welcome to the Bookclub".
8. **Given** a person has just registered with a username and password, **When** the site shows their account, **Then** the page has a left column with that username at the top and the signed-in options below that, with no "Regular member" label, and a main area that says they are a regular member.

---

### User Story 2 - Sign in again with a username and password (Priority: P1)

A member who registered with a username and password stays signed in until they sign out. After they sign out, they can return by signing in with those same credentials. Leaving the site does not sign them out.

**Why this priority**: The request says the member must be able to use those credentials to log in later. An account they cannot re-enter does not meet that request.

**Independent Test**: Starting from a member who already has a username and password and is signed out, that member can sign in with those credentials and be recognized as the same member.

**Acceptance Scenarios**:

1. **Given** a member who registered with a username and password is signed out, **When** they submit that username in any letter case and the correct password, **Then** they are signed in as that same member.
2. **Given** a person submits a username and password that do not match a member, **When** they try to sign in, **Then** they stay signed out and the message does not say whether the username exists.
3. **Given** a member is signed in, **When** they sign out, **Then** they are signed out and must sign in again before the site treats them as that member.
4. **Given** a member is signed in, **When** they leave the site and come back without signing out, **Then** they are still signed in as that member.
5. **Given** a person has already submitted wrong username and password attempts, **When** they try again any number of times, **Then** each attempt is checked the same way, the message stays the same, and nobody is locked out or slowed down.
6. **Given** a member has just signed in with a username and password, **When** the site shows their account, **Then** the page has a left column with that username at the top and the signed-in options below it, and a main area with the account details.

---

### User Story 3 - Tell admins from regular members (Priority: P1)

The site already has two admin members when it starts. A person who registers becomes a regular member. After signing in, the member can see which kind of member they are.

**Why this priority**: The two kinds of member are part of how the site is set up. Registration is not useful as an admin path, because every new registration is a regular member.

**Independent Test**: On a site nobody has registered with yet, bow can sign in with the password admin and is shown as an admin. A newly registered member is shown as a regular member.

**Acceptance Scenarios**:

1. **Given** the site has just started and nobody has registered, **When** bow signs in with the password admin, in any letter case for the username, **Then** bow is signed in as an admin.
2. **Given** the site has just started and nobody has registered, **When** pamela signs in with the password admin, **Then** pamela is signed in as an admin.
3. **Given** bow and pamela already exist, **When** someone tries to register with either username in any letter case, **Then** no new member is created and they are told that the username is already taken.
4. **Given** an admin is signed in, **When** the account page is shown, **Then** the left column shows that username with "Admin" under it, and the main area says they are an admin.
5. **Given** the site is started again, **When** the admin members are already present, **Then** bow and pamela are not created a second time and their passwords are left as they are.

---

### Edge Cases

- A username that differs from an existing username only by letter case is treated as taken.
- Spaces at the start or end of a username are ignored. A space in the middle of a username is rejected.
- A password of any length and composition is accepted, including an empty password, a password with no numbers, and a password that matches the username.
- If two people submit the same unused username at the same time, only one member is created. The other person is told that the username is taken.
- A person who is already signed in cannot create a second member by starting registration again.
- An unknown username and a wrong password produce the same sign-in message.
- A sign-in does not end because time has passed or because the member left the site. It ends when the member signs out.
- Repeated wrong sign-in attempts do not lock a member out, slow the next attempt, or change the refusal message.
- The site does not offer Google, or any other outside account, as a way to register or sign in.
- A person who registers is always a regular member, including when the password is admin.
- bow and pamela are admins from the start. Starting the site again does not duplicate them or change their passwords.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST allow a person who is not signed in to register as a member by supplying a username and password.
- **FR-002**: Usernames MUST be unique regardless of letter case. The site MUST keep and show the casing the member chose.
- **FR-003**: The site MUST ignore spaces at the start or end of a username, and MUST reject a username that is empty after that, is shorter than 3 characters, is longer than 30 characters, contains a space, or contains any character other than letters, numbers, hyphens, and underscores. A username MUST start with a letter or number.
- **FR-004**: The site MUST accept any password string of any length. It MUST NOT reject a password for being empty, short, long, missing a letter, missing a number, or matching the username.
- **FR-005**: The site MUST hide the password while it is entered and MUST NOT show that password to the member or to anyone else after it is submitted.
- **FR-006**: After a successful username-and-password registration, the site MUST sign that member in.
- **FR-007**: A member who registered with a username and password MUST be able to sign out, and later sign in by supplying that same username and password. Username matching during sign-in MUST ignore letter case.
- **FR-008**: When a username and password do not match a member, the site MUST refuse sign-in and MUST use the same message whether the username is unknown or the password is wrong.
- **FR-009**: Passwords MUST stay private to the member who owns them. Another person MUST NOT be able to view a password. The only availability fact the site may reveal to someone else is that a chosen username is taken, without naming the member who holds it.
- **FR-010**: If a person is already signed in, the site MUST NOT create another member for them.
- **FR-011**: When registration or sign-in is refused, the site MUST tell the person why in plain language, except where FR-008 forbids revealing whether a username exists.
- **FR-012**: A sign-in MUST last until the member signs out. The site MUST NOT end a sign-in because time has passed or because the member left the site. After sign-out, the member MUST sign in again to be recognized.
- **FR-013**: The site MUST allow any number of sign-in attempts. It MUST NOT slow down, temporarily refuse, or lock a member because of repeated wrong attempts. Each wrong username-and-password attempt MUST still follow FR-008.
- **FR-014**: Every page MUST show a header whose text is "Welcome to the Bookclub".
- **FR-015**: The site MUST arrange each page as a left column of options and a main area for the selected option. When a member is signed in, the left column MUST show that member's username at the top. An admin MUST have the label "Admin" under the username. A regular member MUST NOT have a role label. Successful registration and successful sign-in MUST open the book club page in that arrangement. The account page MUST remain available from the left column for an admin.
- **FR-016**: The site MUST NOT offer Google, or any other outside account, as a way to register or sign in.
- **FR-017**: A member MUST be either a regular member or an admin. The site MUST start with two admin members, username bow and username pamela, both with the password admin. Registration MUST create a regular member and MUST NOT create an admin. A signed-in admin MUST see that they are an admin. A regular member is not labeled.

### Key Entities *(include if feature involves data)*

- **Member**: A person with an account on the book club site. In this feature the member signs in with a username and password, and is either a regular member or an admin. A member is either signed in or signed out. Creating a member does not by itself join a particular club.
- **Username**: The public sign-in name chosen by a member. It is unique on the site regardless of letter case.
- **Password**: A secret known to the member who chose it. The site accepts it to sign that member in and never displays it after submission.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A person with a valid unused username and a valid password can finish registration and be signed in in under 2 minutes.
- **SC-002**: At least 95% of people who submit valid, unused registration details succeed on the first attempt.
- **SC-003**: A returning member can sign in with the credentials they registered with in under 1 minute.
- **SC-004**: In a review of refused attempts, 100% of duplicate usernames result in no additional member.
- **SC-005**: In a review of what members and other people can see, 0 submitted passwords are visible after submission.
- **SC-006**: The site can accept 50 registration attempts in the same minute without refusing a valid new member because of crowding.

## Assumptions

- "Book club member" in this feature means a person with an account on the book club site. Opening a suggestion round and suggesting books are specified separately. Voting, meetings, and discussions are out of scope for this feature.
- Registration does not ask for an email address, and the site does not verify an email address.
- Password change, username change, and account deletion are out of scope. A member cannot reset their own password in this feature. A later feature may let an admin manually reset a password for a member who cannot sign in. This feature does not include that admin reset.
- The site is a fun website and does not hold sensitive information beyond the member's password. That is why repeated sign-in attempts are not limited.
- Sign-in with Google, or with any service other than the site username and password, is out of scope (FR-016).
- A member stays signed in until they sign out (FR-012). There is no time limit. Leaving the site does not end the sign-in.
- After registration or sign-in, the member sees the book club page (FR-015). The left column is the list of options. Its top line is the member's username. An admin has "Admin" under that name. A regular member does not. The main area shows the selected option. Signed-out pages use the same two-column arrangement, with Register and Sign in as the options and no name at the top.
- Before anyone registers, the only members are the seeded admins bow and pamela (FR-017). Admin powers beyond being identified as an admin, including an admin password reset, remain a later feature.
