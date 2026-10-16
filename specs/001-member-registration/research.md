# Research: Member Registration

## Runtime

- **Decision**: Node.js 24 LTS and TypeScript 7.0.
- **Rationale**: On 2026-10-05, Node.js 24 (Krypton) is the Active LTS line. Node.js 26 is still Current and is not scheduled to enter LTS until 2026-10-28. TypeScript 7.0 is the current stable language release (7.0.2, August 2026). The core and the website share one language, so a later mobile client can call the same rules without translating them.
- **Alternatives considered**: Node.js 26 was rejected because it is not LTS yet. Python or C# were rejected because the planning input chose TypeScript. A second language for the website was rejected because it would duplicate member rules.

## Web framework

- **Decision**: The website uses Node's built-in `node:http` and server-rendered HTML forms. It does not use a web UI framework.
- **Rationale**: This feature is a handful of forms: register, sign in, sign out, and the signed-in account view. A framework would be a dependency the constitution says must be justified. Built-in HTTP keeps the website a thin client of the core.
- **Alternatives considered**: Next.js and React were rejected because they pull UI concerns toward shared code and are more structure than these forms need. A separate API process was rejected for the same reason: the website can call the core in-process.

## Storage

- **Decision**: SQLite through Node's built-in `node:sqlite`, in a file for the website and in memory for core tests.
- **Rationale**: The planning input requires SQLite. `node:sqlite` is included in Node.js 24 (available without the experimental flag since Node.js 22.13, and marked a release candidate since Node.js 25.7). Using it adds no native addon. Core tests open `:memory:` and never start the website.
- **Alternatives considered**: `better-sqlite3` was rejected because it is a native addon the built-in module already replaces. PostgreSQL was rejected because this feature does not need a separate database server. JSON files were rejected because unique usernames need a transactional unique constraint.

## Password storage

- **Decision**: Store a password only as a Node.js `scrypt` hash plus a random salt. Never store or return the password itself. Compare with a timing-safe equality check. When the username does not exist, still run a comparison against a dummy hash so the failure path does not reveal that fact by returning faster.
- **Rationale**: `node:crypto` is built in, so the core gains no hashing dependency. The spec forbids showing a password after it is submitted and forbids telling a stranger whether a username exists.
- **Alternatives considered**: A dedicated bcrypt or argon2 package was rejected as an extra dependency for a fun site whose only secret is the password. Storing the password in reversible form was rejected.

## Sign-in lifetime

- **Decision**: The core stores a session with no expiry time. Sign-out marks that session ended. The website sends a persistent cookie for the session id and refreshes that cookie on each visit. The application never expires a session because time passed or because the member left.
- **Rationale**: The spec says a sign-in lasts until sign-out, including after the member leaves and comes back. A cookie that dies when the browser session ends would sign them out on leaving. Browsers cap how long a cookie may live (commonly 400 days). Refreshing the cookie on each visit keeps an active member signed in without the application inventing a 12-hour or 30-day timeout.
- **Alternatives considered**: A 30-day server timeout was rejected because clarification chose no time limit. A cookie with no persistence was rejected because leaving the site would end the sign-in.

## Google sign-in

- **Decision**: Google registration and Google sign-in are not part of this feature. Members register and sign in with a username and password only. Neither the core nor the website stores a Google account or calls Google.
- **Rationale**: The product decision on 2026-10-05 removed the Google path entirely.
- **Alternatives considered**: Keeping Google as a second sign-in method was the earlier plan. It was dropped so the site has one way to join.

## Sign-in attempts

- **Decision**: The core checks every password attempt immediately, with no counter, delay, or lock. Wrong username and wrong password return one failure code.
- **Rationale**: The spec allows any number of attempts and forbids slowdown and lockout. An admin password reset is a later feature and has no tables or screens in this plan.
- **Alternatives considered**: Temporary lockout and progressive delay were rejected by clarification.

## Testing

- **Decision**: `node:test` for core behavior, using an in-memory SQLite database. Website checks cover HTML forms and the persistent cookie. No browser is required for the core suite.
- **Rationale**: The constitution says core behavior must be testable with no website and no mobile app present. Node's test runner adds no test framework dependency.
- **Alternatives considered**: Jest and Vitest were rejected as extra dependencies. Browser-only end-to-end tests were rejected as the sole proof of member rules, because those rules must pass without a website.

## Username letters

- **Decision**: "Letter" means any Unicode letter. "Number" means any Unicode decimal digit. The username is trimmed, then checked. Uniqueness uses a case-folded copy; the member's chosen casing is stored separately.
- **Rationale**: The spec says letters and numbers, not "English letters only." Case-folding matches the rule that uniqueness ignores letter case.
- **Alternatives considered**: ASCII-only usernames were rejected as narrower than the spec.
