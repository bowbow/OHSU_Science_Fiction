# Research: Vote for a Book

No new technology choice. The stack and the one book club stay as in the earlier features.

## Decisions

- **One row per member.** `book_votes` has a unique member id. Moving a vote replaces that row's suggestion. Voting again for the same suggestion leaves the row as it is.
- **Counts and order come from the core.** The list query counts votes per suggestion and orders by that count descending, then by suggestion time ascending.
- **Deleting a suggestion deletes its votes.** The vote row references the suggestion with delete cascading, so a removed book frees those members to vote again.
- **The page marks the current vote.** The list includes whether the signed-in member holds the vote on that suggestion. The page shows "Your vote" there and "Vote" on the others.
