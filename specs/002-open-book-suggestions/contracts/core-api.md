# Contract: Book club core API

These operations extend the member core. They do not replace registration or sign-in.

There is one book club. A signed-out caller receives `not_signed_in` and no suggestion titles.

## bookClubRounds

- **Input**: session id.
- **Success**: the one book club, or an empty list when an admin has not created it yet. Suggestions include `title` and the suggester's `username`. The voting feature orders them by votes, most first, with the earlier suggestion first when the counts are equal.
- **Failure**: `not_signed_in`.

## openBookClub

- **Caller**: signed-in admin.
- **Success**: the one book club has status `open_for_suggestions`. If it does not exist yet, it is created with an empty suggestion list. If it already exists, its suggestions stay.
- **Failure**: `not_signed_in`, `not_an_admin`.

## suggestBook

- **Caller**: signed-in admin or regular member, and only while the book club status is `open_for_suggestions`.
- **Input**: session id and title.
- **Success**: stores the title on the one book club.
- **Failure**: `not_signed_in`, `suggestions_closed`, `title_empty`, `already_suggested`.
- A duplicate is the same normalized title on that club. The failure does not add a row.
