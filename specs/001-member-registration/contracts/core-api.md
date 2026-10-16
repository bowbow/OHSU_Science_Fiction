# Contract: Core API

The core is a TypeScript library. The website calls it in-process. A later mobile app calls these same operations. The core does not render pages, set cookies, or contact an outside account provider.

Inputs and outputs below are the contract. They are not an implementation.

## Shared results

Success includes the new or current session id and the signed-in member view.

The member view includes:

- `id`
- `username`
- `role`: `regular` or `admin`

The member view never includes a password, hash, or salt.

Failures use a code. The website maps codes to sentences in [web-pages.md](web-pages.md).

| Code | When |
| --- | --- |
| `username_invalid` | Username breaks the rules in `data-model.md`. Includes a reason: empty, too short, too long, bad characters, or must start with a letter or number. |
| `username_taken` | Normalized username already belongs to a member. |
| `invalid_credentials` | Username and password do not match a member. Used both when the username is unknown and when the password is wrong. |
| `already_signed_in` | The caller passed a session that is still signed in, and asked to register. |

## registerWithPassword

- **Caller**: website, only when the visitor is signed out.
- **Input**: `username`, `password`, and the current session id if any.
- **Success**: creates a regular member and a session with no end time. The role is `regular`.
- **Failure**: `already_signed_in`, `username_invalid`, or `username_taken`. A password is never rejected for length or composition. On failure, no member is created.

## signInWithPassword

- **Input**: `username`, `password`.
- **Success**: session for the existing member. Username match ignores case.
- **Failure**: `invalid_credentials`. No delay and no lock. The same code is returned every time.

## signOut

- **Input**: session id.
- **Success**: sets that session's end time. A later read of the same id returns signed out.
- An unknown or already ended session stays signed out.

## currentMember

- **Input**: session id.
- **Success**: member view when the session exists and has no end time.
- **Signed out**: no member view when the id is missing, unknown, or ended.
- Does not end the session because of age.

## Boundary

Core tests call these operations with an in-memory database. They do not open a port or read cookies.
