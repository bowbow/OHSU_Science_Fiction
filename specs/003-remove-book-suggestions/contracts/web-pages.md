# Contract: Remove action on the book club page

The website calls `removeBookSuggestion`. The list and state rules from feature 002 stay.

| Method and path | Who | Behavior |
| --- | --- | --- |
| `GET /book-club` | regular member, suggestions open | Shows Remove beside each book that member suggested. Other books have no Remove action. |
| `GET /book-club` | admin, suggestions open | Shows Remove beside every book. |
| `POST /book-club/suggestions/remove` | signed-in member allowed to remove that book | Calls `removeBookSuggestion`. Success redirects to the book club page without that book. |
| `POST /book-club/suggestions/remove` | regular member, someone else's book | The book stays. The page shows the sentence below. |
| `POST /book-club/suggestions/remove` | signed out | No suggestion titles. Asks the person to sign in. |

## Sentences

| Core code | Sentence |
| --- | --- |
| `not_your_suggestion` | You can only remove a book you suggested. |
| `suggestion_not_found` | That book is no longer on the list. |

The button label is "Remove".
