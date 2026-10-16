# Contract: Remove book suggestion

This operation extends the book club core. It does not replace suggesting a book.

A signed-out caller receives `not_signed_in` and no suggestion titles.

## removeBookSuggestion

- **Caller**: a signed-in member.
- **Input**: session id and suggestion id.
- **Success**: that suggestion row is deleted. The returned title is the title that was removed.
- **Regular member**: success only when `suggested_by` is that member. Otherwise `not_your_suggestion`, and the row stays.
- **Admin**: success for any existing suggestion.
- **Failure**: `not_signed_in`, `not_your_suggestion`, `suggestion_not_found`.
- A missing or already deleted suggestion returns `suggestion_not_found` and does not change the list.

`bookClubRounds` includes each suggestion's id so a client can name the row to remove. Titles and suggester usernames stay as in feature 002.
