# Quickstart: Member Registration

Validation guide for the planned website and core. Implementation belongs in the tasks that follow this plan.

## Prerequisites

- Node.js 24 LTS
- npm

## Setup

From the repository root:

```bash
npm install
```

The website reads the SQLite file path from its own configuration. Core tests do not use that configuration. They open an in-memory database.

## Core checks

Run the core test suite with no website process and no browser:

```bash
npm test --workspace @bookclub/core
```

Expected: every core acceptance case passes, including username rules, the single generic password-failure result, unlimited immediate retries, and sessions that stay open until sign-out.

Also confirm the core package declares no dependency on a web framework or a mobile framework. Its tests import none of those.

## Website checks

Start the site:

```bash
npm start --workspace @bookclub/web
```

Then walk these paths in a browser. Details of fields and sentences are in [contracts/web-pages.md](contracts/web-pages.md). Stored records are in [data-model.md](data-model.md).

1. Register with a valid unused username and password. The password is hidden while typing. The account page is two columns: the username is at the top of the left column, and the account details are in the main area. The session cookie is persistent.
2. Close the tab, open the site again, and confirm the same member is still signed in. Sign out. Confirm the account page is no longer available until sign-in.
3. Sign in with the same username in a different letter case and the same password. It takes well under a minute.
4. Sign in with a wrong password, then repeat. Each try returns "Username or password is incorrect." and does not slow down.
5. Try to register the same username in another letter case. The sentence says it is taken, and no second member appears.
6. Confirm the register and sign-in pages have no Google option.
7. While signed in, open registration again. No second member is created.
8. Sign out, then sign in as bow with the password admin. The left column shows bow and Admin. Sign out and sign in as pamela with the same password. Registering either of those usernames says the username is taken. A newly registered member is shown as a regular member.

Registration of a valid new member, and a return sign-in, should each finish inside the times in the spec (under 2 minutes to register, under 1 minute to sign in).

## Out of scope for this check

Admin password reset, joining a club, and a mobile client are not part of this feature.
