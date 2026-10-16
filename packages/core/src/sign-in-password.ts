import type { DatabaseSync } from "node:sqlite";
import { failure, type Result } from "./errors.ts";
import { toMemberView } from "./member-view.ts";
import { dummyPasswordCheck, verifyPassword } from "./password.ts";
import { createSession } from "./session.ts";
import { normalizeUsername } from "./username.ts";

type PasswordRow = {
  id: string;
  username: string;
  password_hash: string;
  password_salt: string;
  role: "regular" | "admin";
};

export function signInWithPassword(
  db: DatabaseSync,
  input: { username: string; password: string },
): Result {
  const row = db.prepare(
    `SELECT id, username, password_hash, password_salt, role
     FROM members WHERE username_normalized = ?`,
  ).get(normalizeUsername(input.username)) as PasswordRow | undefined;

  if (!row) {
    dummyPasswordCheck(input.password);
    return failure({ code: "invalid_credentials" });
  }
  if (!verifyPassword(input.password, row.password_hash, row.password_salt)) {
    return failure({ code: "invalid_credentials" });
  }

  const sessionId = createSession(db, row.id);
  return {
    ok: true,
    sessionId,
    member: toMemberView({
      id: row.id,
      username: row.username,
      role: row.role,
    }),
  };
}
