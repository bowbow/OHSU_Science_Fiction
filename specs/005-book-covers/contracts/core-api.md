# Contract: Book covers

`bookClubRounds` includes `coverId` on each suggestion. `null` means no cover to show.

## ensureBookCovers

- **Caller**: signed-in member. A signed-out caller changes nothing.
- **Behavior**: For each suggestion that has not been checked, look up the title. Store the first cover id found, or store that none was found. A lookup error leaves that suggestion unchecked.
- **Duplicate titles**: The club still has one suggestion per normalized title. The lookup does not insert a row.

The real lookup reads Open Library search results and returns a numeric cover id or `null`.
