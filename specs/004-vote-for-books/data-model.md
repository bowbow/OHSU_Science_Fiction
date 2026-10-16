# Data Model: Vote for a Book

Rules below come from `spec.md`. Storage stays the existing SQLite database. The core is the only writer.

## Vote

| Field | Required | Rules |
| --- | --- | --- |
| id | yes | Opaque id assigned by the core. |
| suggestion_id | yes | The suggested book that holds this vote. Deleting that suggestion deletes this vote. |
| member_id | yes | The signed-in member. At most one vote row per member. |
| voted_at | yes | When the vote was placed or last moved. |

A suggestion's vote count is the number of vote rows pointing at it. A suggestion with none has a count of zero.

## List order

Suggestions are ordered by vote count, highest first. When two counts are equal, the earlier `suggested_at` comes first.
