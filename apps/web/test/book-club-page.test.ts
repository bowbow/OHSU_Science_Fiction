import assert from "node:assert/strict";
import { test } from "node:test";
import { openCore } from "@bookclub/core";
import { addTestAdmin } from "../../../packages/core/test/support.ts";
import { createApp } from "../src/app.ts";

function coreWithAdmin() {
  const core = openCore(":memory:");
  addTestAdmin(core);
  return core;
}

async function signIn(app: ReturnType<typeof createApp>, username: string, password: string): Promise<string> {
  const response = await app.handle({
    method: "POST",
    path: "/sign-in",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
  });
  const cookie = response.headers["Set-Cookie"];
  assert.ok(cookie);
  return cookie.split(";")[0] ?? "";
}

test("admins open suggestions and regular members add a remembered title", async () => {
  const app = createApp({ core: coreWithAdmin() });
  const admin = await signIn(app, "bow", "admin");
  const opened = await app.handle({
    method: "POST",
    path: "/book-club/open",
    headers: { cookie: admin },
  });
  assert.equal(opened.status, 303);
  const openPage = await app.handle({
    method: "GET",
    path: "/book-club",
    headers: { cookie: admin },
  });
  assert.match(openPage.body, /Book club is open for book suggestions/);
  assert.match(openPage.body, /No books have been suggested yet/);
  assert.match(openPage.body, /Suggest book/);
  assert.equal(openPage.body.includes("Open a new book club"), false);

  await app.handle({
    method: "POST",
    path: "/register",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "username=Ada&password=secret",
  });
  const regular = await signIn(app, "Ada", "secret");
  const refused = await app.handle({
    method: "POST",
    path: "/book-club/open",
    headers: { cookie: regular },
  });
  assert.match(refused.body, /Only an admin can open a book club for suggestions/);

  const suggested = await app.handle({
    method: "POST",
    path: "/book-club/suggestions",
    headers: { cookie: regular, "content-type": "application/x-www-form-urlencoded" },
    body: "title=The+Hobbit",
  });
  assert.equal(suggested.status, 303);
  const listed = await app.handle({
    method: "GET",
    path: "/book-club",
    headers: { cookie: regular },
  });
  assert.match(listed.body, /The Hobbit/);
  assert.match(listed.body, /title="Suggested by Ada"/);
  assert.equal(listed.body.includes('href="/book-club"'), false);
  assert.match(listed.body, /Sign out/);

  const signedOut = await app.handle({ method: "GET", path: "/book-club", headers: {} });
  assert.equal(signedOut.body.includes("The Hobbit"), false);
  assert.match(signedOut.body, /Sign in to see the book club/);
});

test("a member removes only their own book and an admin can remove any book", async () => {
  const app = createApp({ core: coreWithAdmin() });
  const admin = await signIn(app, "bow", "admin");
  await app.handle({ method: "POST", path: "/book-club/open", headers: { cookie: admin } });
  await app.handle({
    method: "POST",
    path: "/book-club/suggestions",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: "title=Dune",
  });
  await app.handle({
    method: "POST",
    path: "/register",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "username=Ada&password=secret",
  });
  const regular = await signIn(app, "Ada", "secret");
  await app.handle({
    method: "POST",
    path: "/book-club/suggestions",
    headers: { cookie: regular, "content-type": "application/x-www-form-urlencoded" },
    body: "title=The+Hobbit",
  });

  const memberPage = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: regular } });
  assert.match(item(memberPage.body, "The Hobbit"), /Remove/);
  assert.equal(item(memberPage.body, "Dune").includes("Remove"), false);

  const adminPage = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: admin } });
  assert.match(item(adminPage.body, "Dune"), /Remove/);
  assert.match(item(adminPage.body, "The Hobbit"), /Remove/);
  const duneId = suggestionId(adminPage.body, "Dune");
  const hobbitId = suggestionId(memberPage.body, "The Hobbit");

  const refused = await app.handle({
    method: "POST",
    path: "/book-club/suggestions/remove",
    headers: { cookie: regular, "content-type": "application/x-www-form-urlencoded" },
    body: `suggestion=${encodeURIComponent(duneId)}`,
  });
  assert.match(refused.body, /You can only remove a book you suggested/);
  assert.match(refused.body, /Dune/);

  const removed = await app.handle({
    method: "POST",
    path: "/book-club/suggestions/remove",
    headers: { cookie: regular, "content-type": "application/x-www-form-urlencoded" },
    body: `suggestion=${encodeURIComponent(hobbitId)}`,
  });
  assert.equal(removed.status, 303);
  const afterMember = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: regular } });
  assert.equal(afterMember.body.includes("The Hobbit"), false);
  assert.match(afterMember.body, /Dune/);

  const removedByAdmin = await app.handle({
    method: "POST",
    path: "/book-club/suggestions/remove",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: `suggestion=${encodeURIComponent(duneId)}`,
  });
  assert.equal(removedByAdmin.status, 303);
  const afterAdmin = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: admin } });
  assert.equal(afterAdmin.body.includes("Dune"), false);
  assert.match(afterAdmin.body, /No books have been suggested yet/);
});

function item(body: string, title: string): string {
  const needle = `class="book-title"`;
  const marker = `>${title}</span>`;
  let start = body.indexOf(needle);
  while (start >= 0 && !body.slice(start, body.indexOf("</span>", start) + marker.length).includes(marker)) {
    start = body.indexOf(needle, start + needle.length);
  }
  assert.ok(start >= 0, `missing list item for ${title}`);
  const liStart = body.lastIndexOf("<li", start);
  const liEnd = body.indexOf("</li>", start);
  return body.slice(liStart, liEnd);
}

function suggestionId(body: string, title: string): string {
  const match = /name="suggestion" value="([^"]+)"/.exec(item(body, title));
  assert.ok(match, `missing suggestion id for ${title}`);
  return match[1] ?? "";
}

test("a found cover is shown and a missing cover stays text", async () => {
  const app = createApp({
    core: coreWithAdmin(),
    covers: async (title) => title === "Dune" ? 42 : null,
  });
  const admin = await signIn(app, "bow", "admin");
  await app.handle({ method: "POST", path: "/book-club/open", headers: { cookie: admin } });
  await app.handle({
    method: "POST",
    path: "/book-club/suggestions",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: "title=Dune",
  });
  await app.handle({
    method: "POST",
    path: "/book-club/suggestions",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: "title=Not+A+Real+Book+Zzq",
  });
  const page = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: admin } });
  assert.match(item(page.body, "Dune"), /src="https:\/\/covers\.openlibrary\.org\/b\/id\/42-M\.jpg"/);
  assert.match(item(page.body, "Dune"), /class="book-title" hidden/);
  const plain = item(page.body, "Not A Real Book Zzq");
  assert.equal(plain.includes("<img"), false);
  assert.match(plain, /class="book-title">Not A Real Book Zzq<\/span>/);
});

test("members cast one vote, can move it, and the most votes are listed first", async () => {
  const app = createApp({ core: coreWithAdmin() });
  const admin = await signIn(app, "bow", "admin");
  await app.handle({ method: "POST", path: "/book-club/open", headers: { cookie: admin } });
  await app.handle({
    method: "POST",
    path: "/book-club/suggestions",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: "title=Dune",
  });
  await app.handle({
    method: "POST",
    path: "/register",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "username=Ada&password=secret",
  });
  const regular = await signIn(app, "Ada", "secret");
  await app.handle({
    method: "POST",
    path: "/book-club/suggestions",
    headers: { cookie: regular, "content-type": "application/x-www-form-urlencoded" },
    body: "title=The+Hobbit",
  });

  const start = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: regular } });
  assert.match(start.body, /<li class="book"[^>]*>[\s\S]*?0 votes[\s\S]*?Dune[\s\S]*?<li class="book"[^>]*>[\s\S]*?0 votes[\s\S]*?The Hobbit/);
  assert.equal(start.body.includes("Your vote"), false);
  const hobbitId = suggestionId(start.body, "The Hobbit");
  const duneId = suggestionId(start.body, "Dune");

  const voted = await app.handle({
    method: "POST",
    path: "/book-club/votes",
    headers: { cookie: regular, "content-type": "application/x-www-form-urlencoded" },
    body: `suggestion=${encodeURIComponent(hobbitId)}`,
  });
  assert.equal(voted.status, 303);
  const afterFirst = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: regular } });
  assert.match(afterFirst.body, /<li class="book"[^>]*>[\s\S]*?1 vote[\s\S]*?The Hobbit[\s\S]*?Your vote[\s\S]*?<li class="book"[^>]*>[\s\S]*?0 votes[\s\S]*?Dune/);
  assert.match(item(afterFirst.body, "Dune"), /Vote/);
  assert.equal(item(afterFirst.body, "The Hobbit").includes(">Vote<"), false);

  const moved = await app.handle({
    method: "POST",
    path: "/book-club/votes",
    headers: { cookie: regular, "content-type": "application/x-www-form-urlencoded" },
    body: `suggestion=${encodeURIComponent(duneId)}`,
  });
  assert.equal(moved.status, 303);
  await app.handle({
    method: "POST",
    path: "/book-club/votes",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: `suggestion=${encodeURIComponent(duneId)}`,
  });
  const afterMove = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: regular } });
  assert.match(afterMove.body, /<li class="book"[^>]*>[\s\S]*?2 votes[\s\S]*?Dune[\s\S]*?Your vote[\s\S]*?<li class="book"[^>]*>[\s\S]*?0 votes[\s\S]*?The Hobbit/);

  const signedOut = await app.handle({
    method: "POST",
    path: "/book-club/votes",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `suggestion=${encodeURIComponent(duneId)}`,
  });
  assert.equal(signedOut.body.includes("Dune"), false);
  assert.match(signedOut.body, /Sign in to see the book club/);
});

test("an admin closes the call and a regular member sees the winning book alone", async () => {
  const app = createApp({ core: coreWithAdmin() });
  const admin = await signIn(app, "bow", "admin");
  await app.handle({ method: "POST", path: "/book-club/open", headers: { cookie: admin } });
  await app.handle({
    method: "POST",
    path: "/book-club/suggestions",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: "title=Dune",
  });
  await app.handle({
    method: "POST",
    path: "/register",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "username=Ada&password=secret",
  });
  const regular = await signIn(app, "Ada", "secret");
  const openPage = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: regular } });
  assert.equal(openPage.body.includes("Close the call for new books"), false);
  await app.handle({
    method: "POST",
    path: "/book-club/suggestions",
    headers: { cookie: regular, "content-type": "application/x-www-form-urlencoded" },
    body: "title=The+Hobbit",
  });
  const hobbitId = suggestionId(
    (await app.handle({ method: "GET", path: "/book-club", headers: { cookie: regular } })).body,
    "The Hobbit",
  );
  await app.handle({
    method: "POST",
    path: "/book-club/votes",
    headers: { cookie: regular, "content-type": "application/x-www-form-urlencoded" },
    body: `suggestion=${encodeURIComponent(hobbitId)}`,
  });
  const refused = await app.handle({ method: "POST", path: "/book-club/close", headers: { cookie: regular } });
  assert.match(refused.body, /Only an admin can open a book club for suggestions/);
  const closed = await app.handle({ method: "POST", path: "/book-club/close", headers: { cookie: admin } });
  assert.equal(closed.status, 303);
  const winner = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: regular } });
  assert.match(winner.body, /The book club will read The Hobbit/);
  assert.match(winner.body, /class="winner"/);
  assert.equal(winner.body.includes("Dune"), false);
  assert.equal(winner.body.includes(">Vote<"), false);
  assert.equal(winner.body.includes("Suggest book"), false);
  assert.equal(winner.body.includes("Close the call for new books"), false);
  assert.equal(winner.body.includes("Start over"), false);
});

test("a tie asks the admin to choose and hides that choice from a regular member", async () => {
  const app = createApp({ core: coreWithAdmin() });
  const admin = await signIn(app, "bow", "admin");
  await app.handle({ method: "POST", path: "/book-club/open", headers: { cookie: admin } });
  await app.handle({
    method: "POST",
    path: "/book-club/suggestions",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: "title=Dune",
  });
  await app.handle({
    method: "POST",
    path: "/book-club/suggestions",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: "title=The+Hobbit",
  });
  const tied = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: admin } });
  assert.match(tied.body, /These books have the same number of votes/);
  assert.equal(tied.body.match(/Choose this book/g)?.length, 2);
  assert.equal(tied.body.includes("Close the call for new books"), false);
  await app.handle({
    method: "POST",
    path: "/register",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "username=Ada&password=secret",
  });
  const regular = await signIn(app, "Ada", "secret");
  const memberPage = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: regular } });
  assert.equal(memberPage.body.includes("Choose this book"), false);
  const hobbitId = suggestionId(tied.body, "The Hobbit");
  const chosen = await app.handle({
    method: "POST",
    path: "/book-club/close",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: `suggestion=${encodeURIComponent(hobbitId)}`,
  });
  assert.equal(chosen.status, 303);
  const winner = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: regular } });
  assert.match(winner.body, /The book club will read The Hobbit/);
  assert.equal(winner.body.includes("Dune"), false);
  assert.equal(winner.body.includes("Start over"), false);
});

test("an admin starts over and the club opens for suggestions with an empty list", async () => {
  const app = createApp({ core: coreWithAdmin() });
  const admin = await signIn(app, "bow", "admin");
  await app.handle({ method: "POST", path: "/book-club/open", headers: { cookie: admin } });
  await app.handle({
    method: "POST",
    path: "/book-club/suggestions",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: "title=The+Hobbit",
  });
  await app.handle({
    method: "POST",
    path: "/register",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "username=Ada&password=secret",
  });
  const regular = await signIn(app, "Ada", "secret");
  await app.handle({ method: "POST", path: "/book-club/close", headers: { cookie: admin } });
  const chosen = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: admin } });
  assert.match(chosen.body, /The book club will read The Hobbit/);
  assert.match(chosen.body, /Start a new book/);
  assert.match(chosen.body, /Starting over clears the chosen book, the suggestions, the votes, and the meeting time/);
  assert.match(chosen.body, /<button type="submit">Yes<\/button>/);
  assert.match(chosen.body, /start-over-close">No<\/button>/);
  const hidden = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: regular } });
  assert.equal(hidden.body.includes("Start a new book"), false);
  const refused = await app.handle({ method: "POST", path: "/book-club/start-over", headers: { cookie: regular } });
  assert.match(refused.body, /Only an admin can open a book club for suggestions/);
  const restarted = await app.handle({ method: "POST", path: "/book-club/start-over", headers: { cookie: admin } });
  assert.equal(restarted.status, 303);
  const fresh = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: regular } });
  assert.match(fresh.body, /Book club is open for book suggestions/);
  assert.match(fresh.body, /No books have been suggested yet/);
  assert.equal(fresh.body.includes("The Hobbit"), false);
  assert.equal(fresh.body.includes("The book club will read"), false);
  assert.match(fresh.body, /Suggest book/);
});

test("several matching books ask which one to add", async () => {
  const app = createApp({
    core: coreWithAdmin(),
    matches: async (title) => {
      if (title === "Born to Run") {
        return [
          { title: "Born to Run", authors: "Bruce Springsteen", year: 1975, coverId: 1 },
          { title: "Born to Run", authors: "Christopher McDougall", year: 2009, coverId: 2 },
        ];
      }
      if (title === "Dune") {
        return [{ title: "Dune", authors: "Frank Herbert", year: 1965, coverId: 5 }];
      }
      return [];
    },
  });
  const admin = await signIn(app, "bow", "admin");
  await app.handle({ method: "POST", path: "/book-club/open", headers: { cookie: admin } });
  const choice = await app.handle({
    method: "POST",
    path: "/book-club/suggestions",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: "title=Born+to+Run",
  });
  assert.equal(choice.status, 200);
  assert.match(choice.body, /Which book did you mean/);
  assert.match(choice.body, /Christopher McDougall/);
  assert.match(choice.body, /Bruce Springsteen/);
  assert.match(choice.body, /Nothing is added until you pick one/);
  const waiting = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: admin } });
  assert.match(waiting.body, /No books have been suggested yet/);
  const refused = await app.handle({
    method: "POST",
    path: "/book-club/suggestions",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: "title=Born+to+Run&cover=9",
  });
  assert.match(refused.body, /Choose one of the books that matched that title/);
  const added = await app.handle({
    method: "POST",
    path: "/book-club/suggestions",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: "title=Born+to+Run&cover=2",
  });
  assert.equal(added.status, 303);
  const page = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: admin } });
  assert.match(page.body, /\/b\/id\/2-M\.jpg/);
  assert.equal(page.body.includes("/b/id/1-M.jpg"), false);
  const single = await app.handle({
    method: "POST",
    path: "/book-club/suggestions",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: "title=Dune",
  });
  assert.equal(single.status, 303);
  const plain = await app.handle({
    method: "POST",
    path: "/book-club/suggestions",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: "title=Not+A+Real+Book+Zzq",
  });
  assert.equal(plain.status, 303);
  const listed = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: admin } });
  assert.match(listed.body, /\/b\/id\/5-M\.jpg/);
  assert.match(listed.body, /class="book-title">Not A Real Book Zzq<\/span>/);
});

test("members vote for meeting times and a regular member sees the chosen date", async () => {
  const app = createApp({ core: coreWithAdmin() });
  const admin = await signIn(app, "bow", "admin");
  await app.handle({ method: "POST", path: "/book-club/open", headers: { cookie: admin } });
  await app.handle({
    method: "POST",
    path: "/book-club/suggestions",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: "title=The+Hobbit",
  });
  await app.handle({ method: "POST", path: "/book-club/close", headers: { cookie: admin } });
  await app.handle({
    method: "POST",
    path: "/register",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "username=Ada&password=secret",
  });
  const regular = await signIn(app, "Ada", "secret");
  const early = await app.handle({
    method: "POST",
    path: "/book-club/meeting",
    headers: { cookie: regular, "content-type": "application/x-www-form-urlencoded" },
    body: "starts=2026-10-13T19%3A00",
  });
  assert.match(early.body, /Only an admin can open a book club for suggestions/);
  await app.handle({
    method: "POST",
    path: "/book-club/meeting",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: "starts=2026-10-13T19%3A00",
  });
  await app.handle({
    method: "POST",
    path: "/book-club/meeting",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: "starts=2026-10-20T19%3A00",
  });
  const choosing = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: admin } });
  assert.equal(choosing.body.includes("datetime-local"), false);
  assert.match(choosing.body, /class="cal-add"/);
  assert.match(choosing.body, /Click an open day to propose a time/);
  assert.match(choosing.body, /data-date="2026-10-13"/);
  assert.match(choosing.body, /data-date="2026-10-20"/);
  assert.match(choosing.body, /October 13, 2026 at 7:00 PM/);
  assert.match(choosing.body, /October 20, 2026 at 7:00 PM/);
  assert.match(choosing.body, /These times have the same number of votes/);
  assert.equal(choosing.body.match(/Choose this time/g)?.length, 2);
  assert.equal(choosing.body.includes("Date selected"), false);
  const adminList = choosing.body.slice(choosing.body.indexOf('class="meetings"'));
  assert.equal(adminList.includes(">Vote<"), false);
  const memberPage = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: regular } });
  assert.match(memberPage.body, /data-date="2026-10-13"[\s\S]*?action="\/book-club\/meeting\/votes"/);
  assert.match(memberPage.body, /class="cal-count">0 votes<\/span>/);
  assert.match(memberPage.body, /Click each day you can attend/);
  assert.equal(memberPage.body.includes('class="cal-add"'), false);
  assert.equal(memberPage.body.includes("Click an open day to propose a time"), false);
  assert.equal(memberPage.body.includes('class="meetings"'), false);
  assert.equal(memberPage.body.includes("Choose this time"), false);
  assert.equal(memberPage.body.includes("Propose this time"), false);
  assert.equal(memberPage.body.includes("Date selected"), false);
  const first = meetingId(choosing.body, "October 13, 2026 at 7:00 PM");
  const second = meetingId(choosing.body, "October 20, 2026 at 7:00 PM");
  await app.handle({
    method: "POST",
    path: "/book-club/meeting/votes",
    headers: { cookie: regular, "content-type": "application/x-www-form-urlencoded" },
    body: `meeting=${encodeURIComponent(first)}`,
  });
  await app.handle({
    method: "POST",
    path: "/book-club/meeting/votes",
    headers: { cookie: regular, "content-type": "application/x-www-form-urlencoded" },
    body: `meeting=${encodeURIComponent(second)}`,
  });
  const both = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: regular } });
  assert.equal(both.body.includes("Your vote"), false);
  assert.equal(both.body.includes("Click each day you can attend"), false);
  assert.match(both.body, /data-date="2026-10-13"[\s\S]*?class="cal-hit voted"/);
  assert.match(both.body, /data-date="2026-10-13"[\s\S]*?action="\/book-club\/meeting\/votes\/remove"/);
  assert.match(both.body, /class="cal-count">1 vote<\/span>/);
  const picked = await app.handle({
    method: "POST",
    path: "/book-club/meeting/select",
    headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" },
    body: `meeting=${encodeURIComponent(second)}`,
  });
  assert.equal(picked.status, 303);
  const done = await app.handle({ method: "GET", path: "/book-club", headers: { cookie: regular } });
  assert.match(done.body, /The book club will read The Hobbit/);
  assert.match(done.body, /The book club will meet on .+October 20, 2026 at 7:00 PM/);
  assert.equal(done.body.includes("October 13, 2026"), false);
  assert.equal(done.body.includes(">Vote<"), false);
  assert.equal(done.body.includes("Propose this time"), false);
});

function meetingId(body: string, when: string): string {
  const marker = 'class="meeting-when">';
  let from = 0;
  while (from < body.length) {
    const start = body.indexOf(marker, from);
    assert.ok(start >= 0, when);
    const textEnd = body.indexOf("</span>", start);
    const liEnd = body.indexOf("</li>", start);
    if (body.slice(start, textEnd).includes(when)) {
      const match = /name="meeting" value="([^"]+)"/.exec(body.slice(start, liEnd));
      assert.ok(match, `missing meeting id near ${when}`);
      return match[1] ?? "";
    }
    from = textEnd + 1;
  }
  return "";
}
