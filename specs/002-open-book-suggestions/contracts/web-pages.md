# Contract: Book club page

The website calls the core API. Successful registration and sign-in open this page. An admin can also reach it from a Book club option in the left column. A regular member does not see that option.

| Method and path | Who | Behavior |
| --- | --- | --- |
| `GET /book-club` | signed out | No suggestion titles. Asks the person to sign in. |
| `GET /book-club` | admin | Shows the current state. When the state is not "Open for book suggestions", offers that action. When it is, shows the list and the suggest form. |
| `GET /book-club` | regular member | Shows the current state. When the state is "Open for book suggestions", shows the books suggested so far and the suggest form. Does not offer the state change. |
| `POST /book-club/open` | admin | Calls `openBookClub`. Success redirects to the book club page. The existing list is kept. |
| `POST /book-club/open` | regular member | Does not change the state. Shows that only an admin can do that. |
| `POST /book-club/suggestions` | signed-in member | Calls `suggestBook`. Success redirects to the book club page with the new title. Failure shows the sentence below. |

## Sentences

| Core code | Sentence |
| --- | --- |
| `not_an_admin` | Only an admin can open a book club for suggestions. |
| `suggestions_closed` | Book suggestions are not open. |
| `title_empty` | Enter a book title. |
| `already_suggested` | That book is already on the list. |

The open state is shown with the words "Open for book suggestions". Pointing at a title shows "Suggested by" and that member's username.
