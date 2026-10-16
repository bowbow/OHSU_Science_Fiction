# Data Model: Activity Log

## Activity line

An activity line is not a club-page record and is not a database row.

| Field | Meaning |
| --- | --- |
| Time | UTC clock time, `YYYY-MM-DD HH:MM:SS UTC` |
| Sentence | One successful action, using the member's display name |

Lines are appended in the order the actions succeed. Nothing in the line is updated later.

## Facts an action must report before a line is written

These facts already exist when the action succeeds. They are returned so the website can build the sentence without a second lookup that might see a later change.

| Action | Extra fact | Line is written when |
| --- | --- | --- |
| Sign in | display name | the password is accepted |
| Register | display name | the account is created |
| Sign out | display name | a signed-in member signs out |
| Suggest | stored title | a book row is inserted, not when catalog choices are only shown |
| Vote for a book | title, and whether the vote is new, moved, or unchanged | the vote is new or moved |
| Remove a book | title and the suggester's display name | the row is deleted |
| Open suggestions | whether the club was already open | the club becomes open |
| Close the call | selected title, or none | a book is chosen, or the call closes with no books |
| Start a new book | none beyond the admin's name | the club is cleared and reopened |
| Propose a time | the stored clock time | the time is added |
| Vote for a time | the stored clock time, and whether a vote was added | a new attendance vote is inserted |
| Withdraw a time vote | the stored clock time, and whether a vote was removed | that member's vote for that time is deleted |
| Remove a time | the stored clock time | the time is deleted |
| Choose a meeting | the stored clock time | the meeting is selected |

The website turns a stored meeting time into the wording members already see, then the core sentence function places that wording in the specified sentence.
