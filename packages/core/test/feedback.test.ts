import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { MAX_FEEDBACK_WORDS, feedbackWordCount, openCore } from "../src/index.ts";
import { addTestAdmin } from "./support.ts";

test("signed-in members can submit up to 1,000 words of feedback", () => {
  const core = openCore(":memory:");
  const registered = core.registerWithPassword({ username: "Ada", password: "reader" });
  assert.equal(registered.ok, true);
  if (!registered.ok) return;

  assert.equal(core.submitFeedback({ sessionId: null, text: "Hello" }).ok, false);
  assert.deepEqual(core.submitFeedback({ sessionId: registered.sessionId, text: "   " }), {
    ok: false,
    failure: { code: "feedback_empty" },
  });

  const maximum = Array.from({ length: MAX_FEEDBACK_WORDS }, (_, index) => `word${index + 1}`).join(" ");
  assert.equal(feedbackWordCount(maximum), MAX_FEEDBACK_WORDS);
  assert.equal(core.submitFeedback({ sessionId: registered.sessionId, text: maximum }).ok, true);

  const overLimit = `${maximum} one-more`;
  assert.deepEqual(core.submitFeedback({ sessionId: registered.sessionId, text: overLimit }), {
    ok: false,
    failure: { code: "feedback_too_long" },
  });
  const stored = core.db.prepare("SELECT COUNT(*) AS count FROM feedback_entries").get() as { count: number };
  assert.equal(stored.count, 1);
});

test("only admins can list feedback and the newest entries come first", () => {
  const core = openCore(":memory:");
  addTestAdmin(core);
  addTestAdmin(core, "Pam", "admin");
  const ada = core.registerWithPassword({ username: "Ada", password: "reader" });
  const bob = core.registerWithPassword({ username: "Bob", password: "reader" });
  assert.equal(ada.ok, true);
  assert.equal(bob.ok, true);
  if (!ada.ok || !bob.ok) return;

  const first = core.submitFeedback({ sessionId: ada.sessionId, text: "Please add more space opera." });
  const second = core.submitFeedback({ sessionId: bob.sessionId, text: "The new website design is excellent." });
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (!first.ok || !second.ok) return;

  core.db.prepare("UPDATE feedback_entries SET submitted_at = ? WHERE id = ?").run("2026-10-18T12:00:00.000Z", first.value.id);
  core.db.prepare("UPDATE feedback_entries SET submitted_at = ? WHERE id = ?").run("2026-10-19T12:00:00.000Z", second.value.id);

  assert.deepEqual(core.feedbackForAdmin(ada.sessionId), {
    ok: false,
    failure: { code: "not_an_admin" },
  });
  assert.deepEqual(core.markFeedbackSeen({ sessionId: ada.sessionId, feedbackId: second.value.id }), {
    ok: false,
    failure: { code: "not_an_admin" },
  });
  const admin = core.signInWithPassword({ username: "bow", password: "admin" });
  assert.equal(admin.ok, true);
  if (!admin.ok) return;

  const listed = core.feedbackForAdmin(admin.sessionId);
  assert.equal(listed.ok, true);
  if (!listed.ok) return;
  assert.deepEqual(listed.value.map((item) => ({ username: item.username, text: item.text, seen: item.seen })), [
    { username: "Bob", text: "The new website design is excellent.", seen: false },
    { username: "Ada", text: "Please add more space opera.", seen: false },
  ]);
  assert.equal(listed.value[0]?.memberId, bob.member.id);

  assert.equal(core.markFeedbackSeen({ sessionId: admin.sessionId, feedbackId: second.value.id }).ok, true);
  const afterOpening = core.feedbackForAdmin(admin.sessionId);
  assert.equal(afterOpening.ok, true);
  if (!afterOpening.ok) return;
  assert.equal(afterOpening.value[0]?.seen, true);
  assert.ok(afterOpening.value[0]?.seenAt);
  assert.equal(afterOpening.value[1]?.seen, false);

  const otherAdmin = core.signInWithPassword({ username: "Pam", password: "admin" });
  assert.equal(otherAdmin.ok, true);
  if (!otherAdmin.ok) return;
  const otherAdminList = core.feedbackForAdmin(otherAdmin.sessionId);
  assert.equal(otherAdminList.ok, true);
  if (!otherAdminList.ok) return;
  assert.equal(otherAdminList.value[0]?.seen, false);

  assert.deepEqual(core.markFeedbackSeen({ sessionId: admin.sessionId, feedbackId: "missing" }), {
    ok: false,
    failure: { code: "feedback_not_found" },
  });
});

test("an admin can delete several feedback items for every admin", () => {
  const core = openCore(":memory:");
  addTestAdmin(core);
  addTestAdmin(core, "Pam", "admin");
  const member = core.registerWithPassword({ username: "Ada", password: "reader" });
  assert.equal(member.ok, true);
  if (!member.ok) return;

  const first = core.submitFeedback({ sessionId: member.sessionId, text: "First message" });
  const second = core.submitFeedback({ sessionId: member.sessionId, text: "Second message" });
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (!first.ok || !second.ok) return;

  assert.deepEqual(core.deleteFeedback({ sessionId: member.sessionId, feedbackIds: [first.value.id] }), {
    ok: false,
    failure: { code: "not_an_admin" },
  });

  const bow = core.signInWithPassword({ username: "bow", password: "admin" });
  const pam = core.signInWithPassword({ username: "Pam", password: "admin" });
  assert.equal(bow.ok, true);
  assert.equal(pam.ok, true);
  if (!bow.ok || !pam.ok) return;

  assert.deepEqual(core.deleteFeedback({ sessionId: bow.sessionId, feedbackIds: [] }), {
    ok: false,
    failure: { code: "feedback_none_selected" },
  });
  assert.equal(core.markFeedbackSeen({ sessionId: bow.sessionId, feedbackId: first.value.id }).ok, true);

  const deleted = core.deleteFeedback({
    sessionId: bow.sessionId,
    feedbackIds: [first.value.id, second.value.id, first.value.id],
  });
  assert.deepEqual(deleted, { ok: true, value: { deleted: 2 } });
  assert.equal((core.db.prepare("SELECT COUNT(*) AS count FROM feedback_entries").get() as { count: number }).count, 2);
  assert.equal((core.db.prepare("SELECT COUNT(*) AS count FROM feedback_entries WHERE deleted_at IS NOT NULL").get() as { count: number }).count, 2);
  assert.equal((core.db.prepare("SELECT COUNT(*) AS count FROM feedback_views").get() as { count: number }).count, 1);

  const visibleToPam = core.feedbackForAdmin(pam.sessionId);
  assert.equal(visibleToPam.ok, true);
  if (!visibleToPam.ok) return;
  assert.deepEqual(visibleToPam.value, []);

  assert.deepEqual(core.markFeedbackSeen({ sessionId: pam.sessionId, feedbackId: first.value.id }), {
    ok: false,
    failure: { code: "feedback_not_found" },
  });
});

test("an existing feedback table gains soft deletion without losing rows", () => {
  const dir = mkdtempSync(join(tmpdir(), "bookclub-feedback-migrate-"));
  const path = join(dir, "club.sqlite");
  try {
    const legacy = new DatabaseSync(path);
    legacy.exec(`
      CREATE TABLE feedback_entries (
        id TEXT PRIMARY KEY,
        member_id TEXT NOT NULL,
        body TEXT NOT NULL,
        submitted_at TEXT NOT NULL
      );
      INSERT INTO feedback_entries (id, member_id, body, submitted_at)
      VALUES ('feedback-1', 'member-1', 'Keep this feedback', '2026-10-20T12:00:00.000Z');
    `);
    legacy.close();

    const core = openCore(path);
    const columns = core.db.prepare("PRAGMA table_info(feedback_entries)").all() as { name: string }[];
    assert.equal(columns.some((column) => column.name === "deleted_at"), true);
    assert.deepEqual(
      { ...core.db.prepare("SELECT body, deleted_at FROM feedback_entries WHERE id = 'feedback-1'").get() },
      { body: "Keep this feedback", deleted_at: null },
    );
    core.db.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
