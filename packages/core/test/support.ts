import type { Core } from "../src/index.ts";

export function addTestAdmin(core: Core, username = "bow", password = "admin"): void {
  const registered = core.registerWithPassword({ username, password });
  if (!registered.ok) {
    throw new Error(`Could not create test admin: ${registered.failure.code}`);
  }
  core.db.prepare("UPDATE members SET role = 'admin' WHERE id = ?").run(registered.member.id);
  core.signOut(registered.sessionId);
}
