import type { Core } from "../src/index.ts";

export function addTestAdmin(core: Core, username = "bow", password = "admin"): void {
  const registrationUsername = username.toLowerCase().endsWith("@ohsu.edu")
    ? username
    : `${username}@ohsu.edu`;
  const registered = core.registerWithPassword({ username: registrationUsername, password });
  if (!registered.ok) {
    throw new Error(`Could not create test admin: ${registered.failure.code}`);
  }
  core.db.prepare(
    "UPDATE members SET username = ?, username_normalized = ?, role = 'admin' WHERE id = ?",
  ).run(username, username.trim().toLowerCase(), registered.member.id);
  core.signOut(registered.sessionId);
}
