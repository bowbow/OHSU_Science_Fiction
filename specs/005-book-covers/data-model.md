# Data Model: Book Covers

The suggestion row from the earlier features gains two fields.

| Field | Required | Rules |
| --- | --- | --- |
| cover_id | no | Open Library cover id when a cover was found. Empty when none was found. |
| cover_checked | yes | Set once a lookup finishes. Unset when the lookup has not finished, including after a failed request. |

Deleting a suggestion deletes this cover record with the row. Votes and the suggester are unchanged.
