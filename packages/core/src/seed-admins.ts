import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { hashPassword } from "./password.ts";

const SEEDED_ADMINS = ["bow"] as const;
const SEEDED_ADMIN_PASSWORD = "admin";

export function seedAdminMembers(db: DatabaseSync): void {
  const existing = db.prepare("SELECT id FROM members WHERE username_normalized = ?");
  const insert = db.prepare(
    `INSERT INTO members (
      id, username, username_normalized, password_hash, password_salt, role, created_at
    ) VALUES (?, ?, ?, ?, ?, 'admin', ?)`,
  );
  for (const username of SEEDED_ADMINS) {
    if (existing.get(username)) {
      continue;
    }
    const { hash, salt } = hashPassword(SEEDED_ADMIN_PASSWORD);
    insert.run(randomUUID(), username, username, hash, salt, new Date().toISOString());
  }
}
