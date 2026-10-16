# Research: Remove Book Suggestions

No new technology choice. The stack and the one book club stay as in feature 002.

## Decisions

- **Removal deletes the suggestion.** The request is to delete or remove a book from the list. The existing `book_suggestions` row is deleted. There is no archive table.
- **The core checks who suggested it.** A regular member may delete a row only when `suggested_by` is their member id. An admin may delete any row. The page hides Remove when the member is not allowed, and the core still refuses a hidden action if it is submitted.
- **The page identifies the row by its id.** Titles are unique on the club, but the stored suggestion id is the value the form submits, so two titles cannot be confused and a removed id can be reported as already gone.
- **No new schema.** `CREATE TABLE IF NOT EXISTS` already created `book_suggestions`. Existing rows stay until someone allowed to remove them does so.
