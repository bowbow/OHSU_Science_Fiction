# Data Model: Open Book Suggestions

Rules below come from `spec.md`. Storage is the same SQLite database as members. The core is the only writer.

## Book club

There is one book club. Setting it to `open_for_suggestions` updates that same row. It does not insert another club and does not delete suggestions.

| Field | Required | Rules |
| --- | --- | --- |
| id | yes | Opaque id assigned by the core. |
| status | yes | `open_for_suggestions` after an admin opens suggestions. Any earlier status means suggestions are not open. |
| opened_at | yes | When the club was first created. |
| closed_at | no | Unused while this feature has no way to leave "Open for book suggestions". |

## Book suggestion

| Field | Required | Rules |
| --- | --- | --- |
| id | yes | Opaque id assigned by the core. |
| book_club_id | yes | The one book club. |
| title | yes | Display title after trimming and collapsing internal whitespace. Casing is kept. |
| title_normalized | yes | Case-folded title. Unique within one round. |
| suggested_by | yes | The regular member who suggested it. |
| suggested_at | yes | When it was suggested. |

Suggestions are listed by the voting feature: the most votes first, and the earlier suggestion first when the counts are equal.

## Not stored in this feature

- Author, link, description, votes, a chosen book, meetings, or discussion.
