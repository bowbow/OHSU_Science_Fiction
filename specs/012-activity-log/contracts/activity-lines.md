# Activity lines

Each line is:

```text
YYYY-MM-DD HH:MM:SS UTC  {sentence}
```

The time is UTC. Two spaces follow `UTC`. `{username}` is the display name. `{title}` is the stored suggestion title, inside quotation marks. `{meeting}` is the wording members already see, such as `Thursday, October 15, 2026 at 7:00 PM`.

| Action | Sentence |
| --- | --- |
| Register | `{username} registered` |
| Sign in | `{username} signed in` |
| Sign out | `{username} signed out` |
| Suggest a book | `{username} suggested "{title}"` |
| Vote for a book | `{username} voted for "{title}"` |
| Move a book vote | `{username} moved their vote to "{title}"` |
| Remove one's own suggestion | `{username} removed "{title}"` |
| Remove someone else's suggestion | `{username} removed "{title}", which {suggester} suggested` |
| Open suggestions | `{username} opened the club for book suggestions` |
| Choose the book | `{username} chose "{title}" as the book the club will read` |
| Close with no book | `{username} closed suggestions and no book was selected` |
| Start a new book | `{username} started a new book` |
| Propose a meeting time | `{username} proposed {meeting}` |
| Vote for a meeting time | `{username} voted to meet on {meeting}` |
| Withdraw a meeting vote | `{username} withdrew their vote for {meeting}` |
| Remove a meeting time | `{username} removed the meeting time {meeting}` |
| Choose the meeting | `{username} chose {meeting} as the meeting` |

No other site action adds a line. A password or session identifier must not appear.
