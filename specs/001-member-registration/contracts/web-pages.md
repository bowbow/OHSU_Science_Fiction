# Contract: Website pages

The website is the only client in this feature. It speaks HTTP and HTML. It calls the core API in [core-api.md](core-api.md). It does not reimplement username or password rules.

Every page shows the header text "Welcome to the Bookclub".

Every page is two columns. The left column lists options. The main area shows the selected option and the header. A signed-out visitor sees Register and Sign in. A signed-in member sees their username at the top of the left column, then Sign out. An admin also sees "Admin" under their username, then Account and Book club. A regular member has no role label and does not see Account or Book club. Successful registration and sign-in open the book club page in that arrangement. The account page remains available from the left column for an admin.

The site has no Google registration, Google sign-in, or other outside-account sign-in.

## Cookie

- Name: `bookclub_session`.
- Value: the core session id.
- `HttpOnly`, `SameSite=Lax`, `Path=/`.
- Persistent, and refreshed on each response while the session is still signed in.
- The website does not set an application timeout. Sign-out clears the cookie and ends the session in the core.
- `Secure` is set when the site is served over HTTPS.

## Pages

| Method and path | Who | Behavior |
| --- | --- | --- |
| `GET /register` | signed out | Form with username and password. Password field is hidden (`type="password"`). |
| `POST /register` | signed out | Calls `registerWithPassword`. Success sets the cookie and shows the account page. Failure redisplays the form and the sentence below. |
| `GET /sign-in` | signed out | Form with username and password. |
| `POST /sign-in` | signed out | Calls `signInWithPassword`. Success sets the cookie and shows the account page. |
| `POST /sign-out` | signed in | Calls `signOut`, clears the cookie, and shows the sign-in page. |
| `GET /account` | signed in | The member sees their username and whether they are an admin or a regular member. |
| `GET /register` or `GET /sign-in` | signed in | Does not show a form that creates another member. Tells the person they are already signed in. |
| `POST /register` | signed in | Does not create a member. |

Leaving the site and opening it again sends the same cookie. `GET /account` still shows that member until they sign out.

## Sentences

| Core code | Sentence |
| --- | --- |
| `username_taken` | That username is already taken. |
| `username_invalid` | The username is not valid, plus the specific reason (length, characters, or starting character). |
| `invalid_credentials` | Username or password is incorrect. |
| `already_signed_in` | You are already signed in. |

`invalid_credentials` does not include a username or member name beyond that sentence.

## Not in this client

- Club pages, password reset, admin reset, Google sign-in, and any other outside account.
- A mobile app. A later app should call the core API rather than copy these forms' rules.
