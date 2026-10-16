# Contract: Vote for a book

These details extend the book club core. Suggesting and removing a book stay as they are.

A signed-out caller receives `not_signed_in` and no suggestion titles or vote counts.

## bookClubRounds

Each suggestion includes `votes` and whether the signed-in member's vote is on that suggestion. Order is vote count descending, then earlier suggestion first.

## voteForBook

- **Caller**: any signed-in member.
- **Input**: session id and suggestion id.
- **Success**: that member has one vote, on that suggestion. If they had a vote on another suggestion, that other suggestion loses it. If they already voted for this suggestion, the counts stay the same.
- **Failure**: `not_signed_in`, `suggestion_not_found`.

Removing a suggestion deletes the votes on it. Those members have no vote until they vote again.
