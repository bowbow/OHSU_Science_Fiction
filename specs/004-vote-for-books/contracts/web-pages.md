# Contract: Votes on the book club page

The website calls `voteForBook`. The list from feature 002 and the Remove action from feature 003 stay.

| Method and path | Who | Behavior |
| --- | --- | --- |
| `GET /book-club` | signed-in member, suggestions open | Each book shows its vote count. The book that holds this member's vote says "Your vote". Every other book offers Vote. The most votes are first. |
| `POST /book-club/votes` | signed-in member | Calls `voteForBook`. Success redirects to the book club page with the updated counts and order. |
| `POST /book-club/votes` | signed out | No suggestion titles or counts. Asks the person to sign in. |

## Sentences

| Shown text | When |
| --- | --- |
| `0 votes`, `1 vote`, `2 votes`, and so on | Beside each book. One vote uses the singular. |
| `Your vote` | Beside the book that holds the signed-in member's vote. |
| `Vote` | The button on every other book. |
| `That book is no longer on the list.` | The suggestion id is missing. |
