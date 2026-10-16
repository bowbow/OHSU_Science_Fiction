import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { failure, isUniqueConstraint, type Result } from "./errors.ts";
import { toMemberView } from "./member-view.ts";
import { hashPassword } from "./password.ts";
import { createSession, currentMember } from "./session.ts";
import { displayUsername, normalizeUsername, validateUsername } from "./username.ts";

export function registerWithPassword(
  db: DatabaseSync,
  input: { username: string; password: string; sessionId?: string | null },
): Result {
  if (currentMember(db, input.sessionId)) {
    return failure({ code: "already_signed_in" });
  }
  const usernameReason = validateUsername(input.username);
  if (usernameReason) {
    return failure({ code: "username_invalid", reason: usernameReason });
  }

  const id = randomUUID();
  const username = displayUsername(input.username);
  const usernameNormalized = normalizeUsername(input.username);
  const { hash, salt } = hashPassword(input.password);
  const createdAt = new Date().toISOString();

  try {
    db.exec("BEGIN");
    db.prepare(
      `INSERT INTO members (
        id, username, username_normalized, password_hash, password_salt, role, created_at
      ) VALUES (?, ?, ?, ?, ?, 'regular', ?)`,
    ).run(id, username, usernameNormalized, hash, salt, createdAt);
    const sessionId = createSession(db, id);
    db.exec("COMMIT");
    return {
      ok: true,
      sessionId,
      member: toMemberView({
        id,
        username,
        role: "regular",
      }),
    };
  } catch (error) {
    db.exec("ROLLBACK");
    if (isUniqueConstraint(error)) {
      return failure({ code: "username_taken" });
    }
    throw error;
  }
}
