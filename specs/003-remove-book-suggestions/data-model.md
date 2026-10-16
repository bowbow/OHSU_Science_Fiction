# Data Model: Remove Book Suggestions

Rules below come from `spec.md`. Storage stays the book club and suggestion tables from feature 002. The core is the only writer.

## Book suggestion

No new fields. Removal deletes the suggestion row.

| Field | Use in this feature |
| --- | --- |
| id | Identifies the suggestion to remove. |
| suggested_by | A regular member may remove the row only when this is their member id. An admin may remove the row regardless of this value. |
| title | After deletion, that normalized title may be suggested again. |

Other suggestion rows, the book club row, and member rows are unchanged.

## Not stored in this feature

- A removal history, an archive, or a confirmation record.
