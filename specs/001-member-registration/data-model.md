# Data Model: Member Registration

Rules below come from `spec.md`. Storage is SQLite. The core is the only writer.

## Member

A person with an account. A member signs in with a username and password. Creating a member does not join a club. The member record does not store a Google account.

| Field | Required | Rules |
| --- | --- | --- |
| id | yes | Opaque id assigned by the core. Never chosen by the visitor. |
| username | yes | Trimmed display casing the member chose. 3–30 characters. Letters, numbers, hyphens, and underscores. Must start with a letter or number. No spaces after trimming. |
| username_normalized | yes | Case-folded username. Unique across all members. |
| password_hash | yes | `scrypt` hash. Never returned by any core operation or page. |
| password_salt | yes | Random salt for that hash. Never returned. |
| role | yes | `regular` or `admin`. Registration always stores `regular`. |
| created_at | yes | When the member was created. |

Constraints:

- Two simultaneous registrations of the same normalized username: the unique constraint keeps one member. The other attempt fails as "username taken."
- On startup, if `bow` is not already a member, the core creates that admin with password `admin`. The same is done for `pamela`. If either username already exists, that member is left unchanged.

Password:

- Any string of any length is accepted, including an empty password.
- The site does not reject a password for length, letters, numbers, or matching the username.
- The stored value is still a `scrypt` hash. The password itself is never returned.

## Session

The record that a member is signed in. The spec's "signed in" and "signed out" states are this record.

| Field | Required | Rules |
| --- | --- | --- |
| id | yes | Unguessable id. This is the only value the website cookie stores. |
| member_id | yes | The member who is signed in. |
| created_at | yes | When the sign-in started. |
| ended_at | no | Empty while signed in. Set when the member signs out. |

State transitions:

- Registration or a successful sign-in creates a session with no `ended_at`.
- Sign-out sets `ended_at`. That session cannot be used again.
- There is no expiry column. Time passing does not end a session.
- A member with a session whose `ended_at` is empty is signed in. Any other visitor is signed out.

Who can see what:

- A signed-in member can see their own username in the casing they chose, and can see whether they are an admin or a regular member.
- No operation returns a password, hash, or salt.
- A stranger may learn only that a username is taken. They do not learn who holds it, or whether a username exists during a failed sign-in.

## Not stored in this feature

- Clubs, books, meetings, and discussions.
- Google accounts, and any other outside sign-in.
- Password reset, password change, username change, account deletion, and admin reset.
- Failed-attempt counters or lockout timestamps.
