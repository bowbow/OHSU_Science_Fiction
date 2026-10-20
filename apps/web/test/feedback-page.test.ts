import assert from "node:assert/strict";
import { test } from "node:test";
import { openCore } from "@bookclub/core";
import { addTestAdmin } from "../../../packages/core/test/support.ts";
import { createApp } from "../src/app.ts";
import { feedbackSummary } from "../src/feedback-page.ts";

test("signed-in users can submit feedback with a 1,000-word limit", async () => {
  const core = openCore(":memory:");
  const app = createApp({ core });

  const signedOut = await app.handle({ method: "GET", path: "/feedback", headers: {} });
  assert.match(signedOut.body, /Sign in to provide feedback/);

  const registered = await app.handle({
    method: "POST",
    path: "/register",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "username=Ada&password=reader",
  });
  const cookie = registered.headers["Set-Cookie"]?.split(";")[0];
  assert.ok(cookie);

  const form = await app.handle({ method: "GET", path: "/feedback", headers: { cookie } });
  assert.match(form.body, /href="\/feedback" aria-current="page">Provide feedback/);
  assert.match(form.body, /<textarea[^>]*name="feedback"[^>]*required/);
  assert.match(form.body, /Maximum 1,000 words/);
  assert.match(form.body, /<a class="feedback-cancel" href="\/book-club">Cancel<\/a>/);
  assert.equal(form.body.includes('href="/admin/feedback"'), false);

  const empty = await app.handle({
    method: "POST",
    path: "/feedback",
    headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
    body: "feedback=++",
  });
  assert.match(empty.body, /Enter some feedback before submitting/);

  const tooLong = Array.from({ length: 1_001 }, () => "word").join(" ");
  const rejected = await app.handle({
    method: "POST",
    path: "/feedback",
    headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ feedback: tooLong }).toString(),
  });
  assert.match(rejected.body, /Feedback must be 1,000 words or fewer/);

  const submitted = await app.handle({
    method: "POST",
    path: "/feedback",
    headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ feedback: "I would enjoy more discussions about classic science fiction." }).toString(),
  });
  assert.equal(submitted.status, 303);
  assert.equal(submitted.headers.Location, "/feedback?submitted=1");
  const stored = core.db.prepare("SELECT body FROM feedback_entries").all() as { body: string }[];
  assert.deepEqual(stored.map((row) => row.body), ["I would enjoy more discussions about classic science fiction."]);

  const confirmation = await app.handle({ method: "GET", path: "/feedback", query: "submitted=1", headers: { cookie } });
  assert.match(confirmation.body, /Your feedback has been collected and will be shown to the site admins\. Thank you\./);
  assert.equal(confirmation.body.includes('action="/feedback"'), false);
  assert.equal(confirmation.body.includes("<textarea"), false);
});

test("admins see newest-first feedback summaries and can expand the full text", async () => {
  const core = openCore(":memory:");
  addTestAdmin(core);
  const app = createApp({ core });

  const ada = await register(app, "Ada");
  const bob = await register(app, "Bob");
  const longFeedback = Array.from({ length: 55 }, (_, index) => `word${index + 1}`).join(" ") + " <script>alert(1)</script>";
  await submit(app, ada, longFeedback);
  await submit(app, bob, "Latest feedback about the website.");
  core.db.prepare(
    "UPDATE feedback_entries SET submitted_at = '2026-10-18T12:00:00.000Z' WHERE member_id = (SELECT id FROM members WHERE username = 'Ada')",
  ).run();
  core.db.prepare(
    "UPDATE feedback_entries SET submitted_at = '2026-10-19T12:00:00.000Z' WHERE member_id = (SELECT id FROM members WHERE username = 'Bob')",
  ).run();

  const denied = await app.handle({ method: "GET", path: "/admin/feedback", headers: { cookie: ada } });
  assert.match(denied.body, /Only an admin can make that change/);
  assert.equal(denied.body.includes("Latest feedback"), false);

  const feedbackId = (core.db.prepare(
    "SELECT id FROM feedback_entries WHERE member_id = (SELECT id FROM members WHERE username = 'Bob')",
  ).get() as { id: string }).id;
  const deniedSeen = await app.handle({
    method: "POST",
    path: "/admin/feedback/seen",
    headers: { cookie: ada, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ feedback: feedbackId }).toString(),
  });
  assert.equal(deniedSeen.status, 403);

  const signIn = await app.handle({
    method: "POST",
    path: "/sign-in",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "username=bow&password=admin",
  });
  const admin = signIn.headers["Set-Cookie"]?.split(";")[0];
  assert.ok(admin);
  const page = await app.handle({ method: "GET", path: "/admin/feedback", headers: { cookie: admin } });

  assert.match(page.body, /href="\/admin\/feedback" aria-current="page">View feedback/);
  assert.match(page.body, /<time datetime="2026-10-19T12:00:00.000Z">Oct 19, 2026<\/time>/);
  assert.ok(page.body.indexOf("Bob") < page.body.indexOf("Ada"));
  assert.match(page.body, /Latest feedback about the website\./);
  assert.match(page.body, new RegExp(escapeRegExp(feedbackSummary(longFeedback))));
  assert.match(page.body, new RegExp(`class="feedback-item is-unseen" data-feedback-id="${escapeRegExp(feedbackId)}"`));
  assert.match(page.body, new RegExp(`type="checkbox" name="feedback" value="${escapeRegExp(feedbackId)}"`));
  assert.match(page.body, /action="\/admin\/feedback\/delete"/);
  assert.match(page.body, />Delete selected items<\/button>/);
  assert.match(page.body, /Delete the selected feedback items for all admins\?/);
  assert.match(page.body, /Unseen items are bold/);
  assert.match(page.body, /fetch\("\/admin\/feedback\/seen"/);
  assert.equal(page.body.includes("<script>alert(1)</script>"), false);
  assert.match(page.body, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);

  const marked = await app.handle({
    method: "POST",
    path: "/admin/feedback/seen",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ feedback: feedbackId }).toString(),
  });
  assert.equal(marked.status, 204);
  const refreshed = await app.handle({ method: "GET", path: "/admin/feedback", headers: { cookie: admin } });
  assert.match(refreshed.body, new RegExp(`class="feedback-item is-seen" data-feedback-id="${escapeRegExp(feedbackId)}"`));

  const noSelection = await app.handle({
    method: "POST",
    path: "/admin/feedback/delete",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: "",
  });
  assert.match(noSelection.body, /Select at least one feedback item to delete/);

  const deniedDelete = await app.handle({
    method: "POST",
    path: "/admin/feedback/delete",
    headers: { cookie: ada, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ feedback: feedbackId }).toString(),
  });
  assert.equal(deniedDelete.status, 403);
  assert.equal((core.db.prepare("SELECT COUNT(*) AS count FROM feedback_entries").get() as { count: number }).count, 2);

  const feedbackIds = (core.db.prepare("SELECT id FROM feedback_entries ORDER BY submitted_at").all() as { id: string }[])
    .map((item) => ["feedback", item.id] as [string, string]);
  const deleted = await app.handle({
    method: "POST",
    path: "/admin/feedback/delete",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(feedbackIds).toString(),
  });
  assert.equal(deleted.status, 303);
  assert.equal(deleted.headers.Location, "/admin/feedback?deleted=2");
  assert.equal((core.db.prepare("SELECT COUNT(*) AS count FROM feedback_entries").get() as { count: number }).count, 2);
  assert.equal((core.db.prepare("SELECT COUNT(*) AS count FROM feedback_entries WHERE deleted_at IS NOT NULL").get() as { count: number }).count, 2);
  assert.equal((core.db.prepare("SELECT COUNT(*) AS count FROM feedback_views").get() as { count: number }).count, 1);

  const afterDelete = await app.handle({ method: "GET", path: "/admin/feedback", query: "deleted=2", headers: { cookie: admin } });
  assert.match(afterDelete.body, /2 feedback items were deleted/);
  assert.match(afterDelete.body, /No feedback has been submitted yet/);
});

async function register(app: ReturnType<typeof createApp>, username: string): Promise<string> {
  const response = await app.handle({
    method: "POST",
    path: "/register",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password: "reader" }).toString(),
  });
  const cookie = response.headers["Set-Cookie"]?.split(";")[0];
  assert.ok(cookie);
  return cookie;
}

async function submit(app: ReturnType<typeof createApp>, cookie: string, feedback: string): Promise<void> {
  const response = await app.handle({
    method: "POST",
    path: "/feedback",
    headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ feedback }).toString(),
  });
  assert.equal(response.status, 303);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
