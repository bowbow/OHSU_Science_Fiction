import assert from "node:assert/strict";
import { test } from "node:test";
import { openCore } from "../src/index.ts";
import { addTestAdmin } from "./support.ts";

function adminSession() {
  const core = openCore(":memory:");
  addTestAdmin(core);
  const admin = core.signInWithPassword({ username: "bow", password: "admin" });
  assert.equal(admin.ok, true);
  if (!admin.ok) {
    throw new Error("admin sign-in failed");
  }
  const member = core.registerWithPassword({ username: "Ada@ohsu.edu", password: "secret" });
  assert.equal(member.ok, true);
  if (!member.ok) {
    throw new Error("registration failed");
  }
  core.signOut(member.sessionId);
  const regular = core.signInWithPassword({ username: "Ada@ohsu.edu", password: "secret" });
  assert.equal(regular.ok, true);
  if (!regular.ok) {
    throw new Error("regular sign-in failed");
  }
  return { core, adminId: admin.sessionId, regularId: regular.sessionId };
}

test("only an admin can open suggestions or add books", () => {
  const { core, adminId, regularId } = adminSession();
  assert.deepEqual(core.openBookClub(regularId), { ok: false, failure: { code: "not_an_admin" } });
  assert.deepEqual(core.suggestBook({ sessionId: regularId, title: "The Hobbit" }), {
    ok: false,
    failure: { code: "not_an_admin" },
  });
  assert.deepEqual(core.bookClubRounds(null), { ok: false, failure: { code: "not_signed_in" } });

  const opened = core.openBookClub(adminId);
  assert.equal(opened.ok, true);
  assert.deepEqual(core.suggestBook({ sessionId: regularId, title: "The Hobbit" }), {
    ok: false,
    failure: { code: "not_an_admin" },
  });
  const rounds = core.bookClubRounds(adminId);
  assert.equal(rounds.ok, true);
  if (!rounds.ok) {
    return;
  }
  assert.equal(rounds.value.length, 1);
  assert.equal(rounds.value[0]?.status, "open_for_suggestions");
  assert.deepEqual(rounds.value[0]?.suggestions, []);
});

test("an admin suggestion is remembered and duplicates are refused", () => {
  const { core, adminId, regularId } = adminSession();
  assert.equal(core.openBookClub(adminId).ok, true);
  assert.equal(core.suggestBook({ sessionId: adminId, title: "Dune" }).ok, true);
  assert.deepEqual(core.suggestBook({ sessionId: adminId, title: "   " }), {
    ok: false,
    failure: { code: "title_empty" },
  });

  const suggested = core.suggestBook({ sessionId: adminId, title: "  The   Hobbit " });
  assert.deepEqual(suggested, { ok: true, value: { title: "The Hobbit" } });
  assert.deepEqual(core.suggestBook({ sessionId: adminId, title: "the hobbit" }), {
    ok: false,
    failure: { code: "already_suggested" },
  });

  core.signOut(regularId);
  const returned = core.signInWithPassword({ username: "ada@ohsu.edu", password: "secret" });
  assert.equal(returned.ok, true);
  if (!returned.ok) {
    return;
  }
  const rounds = core.bookClubRounds(returned.sessionId);
  assert.equal(rounds.ok, true);
  if (!rounds.ok) {
    return;
  }
  assert.deepEqual(listed(rounds.value[0]?.suggestions ?? []), [
    { title: "Dune", suggestedBy: "bow" },
    { title: "The Hobbit", suggestedBy: "bow" },
  ]);
});

test("opening suggestions again keeps the same club and the same books", () => {
  const { core, adminId, regularId } = adminSession();
  const first = core.openBookClub(adminId);
  assert.equal(first.ok, true);
  if (!first.ok) {
    return;
  }
  assert.equal(core.suggestBook({ sessionId: adminId, title: "The Hobbit" }).ok, true);
  const second = core.openBookClub(adminId);
  assert.equal(second.ok, true);
  if (!second.ok) {
    return;
  }
  assert.equal(second.value.id, first.value.id);
  const rounds = core.bookClubRounds(adminId);
  assert.equal(rounds.ok, true);
  if (!rounds.ok) {
    return;
  }
  assert.equal(rounds.value.length, 1);
  assert.equal(rounds.value[0]?.status, "open_for_suggestions");
  assert.deepEqual(listed(rounds.value[0]?.suggestions ?? []), [{ title: "The Hobbit", suggestedBy: "bow" }]);
});

test("only an admin can remove a suggestion", () => {
  const { core, adminId, regularId } = adminSession();
  assert.equal(core.openBookClub(adminId).ok, true);
  assert.equal(core.suggestBook({ sessionId: adminId, title: "Dune" }).ok, true);
  assert.equal(core.suggestBook({ sessionId: adminId, title: "The Hobbit" }).ok, true);
  assert.equal(core.suggestBook({ sessionId: adminId, title: "Dune Messiah" }).ok, true);

  const before = core.bookClubRounds(regularId);
  assert.equal(before.ok, true);
  if (!before.ok) {
    return;
  }
  const dune = before.value[0]?.suggestions.find((item) => item.title === "Dune");
  const hobbit = before.value[0]?.suggestions.find((item) => item.title === "The Hobbit");
  const messiah = before.value[0]?.suggestions.find((item) => item.title === "Dune Messiah");
  assert.ok(dune && hobbit && messiah);

  assert.deepEqual(core.removeBookSuggestion({ sessionId: regularId, suggestionId: dune.id }), {
    ok: false,
    failure: { code: "not_an_admin" },
  });
  assert.deepEqual(core.removeBookSuggestion({ sessionId: null, suggestionId: hobbit.id }), {
    ok: false,
    failure: { code: "not_signed_in" },
  });
  assert.deepEqual(core.removeBookSuggestion({ sessionId: adminId, suggestionId: hobbit.id }), {
    ok: true,
    value: { title: "The Hobbit", suggestedBy: "bow" },
  });
  assert.equal(core.suggestBook({ sessionId: adminId, title: "The Hobbit" }).ok, true);
  assert.deepEqual(core.removeBookSuggestion({ sessionId: adminId, suggestionId: messiah.id }), {
    ok: true,
    value: { title: "Dune Messiah", suggestedBy: "bow" },
  });
  assert.deepEqual(core.removeBookSuggestion({ sessionId: adminId, suggestionId: messiah.id }), {
    ok: false,
    failure: { code: "suggestion_not_found" },
  });

  const after = core.bookClubRounds(adminId);
  assert.equal(after.ok, true);
  if (!after.ok) {
    return;
  }
  assert.deepEqual(listed(after.value[0]?.suggestions ?? []), [
    { title: "Dune", suggestedBy: "bow" },
    { title: "The Hobbit", suggestedBy: "bow" },
  ]);
});

function listed(suggestions: { title: string; suggestedBy: string }[]) {
  return suggestions.map((item) => ({ title: item.title, suggestedBy: item.suggestedBy }));
}

test("a member has one vote, can move it, and books are ordered by votes", () => {
  const { core, adminId, regularId } = adminSession();
  assert.equal(core.openBookClub(adminId).ok, true);
  assert.equal(core.suggestBook({ sessionId: adminId, title: "Dune" }).ok, true);
  assert.equal(core.suggestBook({ sessionId: adminId, title: "The Hobbit" }).ok, true);

  const start = suggestions(core, regularId);
  assert.deepEqual(start.map((item) => ({ title: item.title, votes: item.votes, votedByMe: item.votedByMe })), [
    { title: "Dune", votes: 0, votedByMe: false },
    { title: "The Hobbit", votes: 0, votedByMe: false },
  ]);

  const dune = start.find((item) => item.title === "Dune");
  const hobbit = start.find((item) => item.title === "The Hobbit");
  assert.ok(dune && hobbit);
  assert.deepEqual(core.voteForBook({ sessionId: null, suggestionId: hobbit.id }), {
    ok: false,
    failure: { code: "not_signed_in" },
  });
  assert.equal(core.voteForBook({ sessionId: regularId, suggestionId: hobbit.id }).ok, true);
  assert.equal(core.voteForBook({ sessionId: regularId, suggestionId: hobbit.id }).ok, true);
  assert.deepEqual(suggestions(core, regularId).map(counts), [
    { title: "The Hobbit", votes: 1, votedByMe: true },
    { title: "Dune", votes: 0, votedByMe: false },
  ]);

  assert.equal(core.voteForBook({ sessionId: regularId, suggestionId: dune.id }).ok, true);
  assert.equal(core.voteForBook({ sessionId: adminId, suggestionId: dune.id }).ok, true);
  assert.deepEqual(suggestions(core, regularId).map(counts), [
    { title: "Dune", votes: 2, votedByMe: true },
    { title: "The Hobbit", votes: 0, votedByMe: false },
  ]);
  assert.equal("voters" in (suggestions(core, regularId).find((item) => item.title === "Dune") ?? {}), false);
  const adminDune = suggestions(core, adminId).find((item) => item.title === "Dune");
  assert.equal(adminDune?.votedByMe, true);
  assert.deepEqual(adminDune?.voters, ["Ada@ohsu.edu", "bow"]);
  assert.deepEqual(suggestions(core, adminId).find((item) => item.title === "The Hobbit")?.voters, []);

  assert.equal(core.removeBookSuggestion({ sessionId: adminId, suggestionId: dune.id }).ok, true);
  const afterRemoval = suggestions(core, regularId);
  assert.deepEqual(afterRemoval.map(counts), [{ title: "The Hobbit", votes: 0, votedByMe: false }]);
  const hobbitAgain = afterRemoval[0];
  assert.ok(hobbitAgain);
  assert.equal(core.voteForBook({ sessionId: regularId, suggestionId: hobbitAgain.id }).ok, true);
  assert.equal(suggestions(core, regularId)[0]?.votes, 1);
});

function suggestions(core: ReturnType<typeof openCore>, sessionId: string) {
  const rounds = core.bookClubRounds(sessionId);
  assert.equal(rounds.ok, true);
  if (!rounds.ok) {
    throw new Error("book club lookup failed");
  }
  return rounds.value[0]?.suggestions ?? [];
}

test("a cover is stored when found, and a missing cover stays text", async () => {
  const { core, adminId, regularId } = adminSession();
  assert.equal(core.openBookClub(adminId).ok, true);
  assert.equal(core.suggestBook({ sessionId: adminId, title: "Dune" }).ok, true);
  assert.equal(core.suggestBook({ sessionId: adminId, title: "Not A Real Book Zzq" }).ok, true);
  let lookups = 0;
  await core.ensureBookCovers(regularId, async (title) => {
    lookups += 1;
    if (title === "Dune") {
      return 42;
    }
    return null;
  });
  await core.ensureBookCovers(regularId, async () => {
    lookups += 1;
    return 99;
  });
  const rows = suggestions(core, regularId);
  assert.equal(lookups, 2);
  assert.equal(rows.find((item) => item.title === "Dune")?.coverId, 42);
  assert.equal(rows.find((item) => item.title === "Not A Real Book Zzq")?.coverId, null);

  assert.equal(core.suggestBook({ sessionId: adminId, title: "Kindred" }).ok, true);
  await core.ensureBookCovers(adminId, async () => {
    throw new Error("offline");
  });
  assert.equal(suggestions(core, adminId).find((item) => item.title === "Kindred")?.coverId, null);
  await core.ensureBookCovers(adminId, async () => 7);
  assert.equal(suggestions(core, adminId).find((item) => item.title === "Kindred")?.coverId, 7);
});

test("book details are stored once and are deleted with the suggestion", async () => {
  const { core, adminId, regularId } = adminSession();
  assert.equal(core.openBookClub(adminId).ok, true);
  assert.equal((await core.suggestMatchedBook(
    { sessionId: adminId, title: "Dune" },
    async () => [{
      title: "Dune",
      authors: "Frank Herbert",
      year: 1965,
      coverId: 42,
      editionKey: "OL42M",
      workKey: "/works/OL42W",
      isbns: ["9780441172719"],
    }],
  )).ok, true);
  let lookups = 0;
  await core.ensureBookDetails(regularId, async (title, authors, editionKey, workIsbns) => {
    lookups += 1;
    assert.equal(title, "Dune");
    assert.equal(authors, "Frank Herbert");
    assert.equal(editionKey, "OL42M");
    assert.deepEqual(workIsbns, ["9780441172719"]);
    return {
      sourceId: "google-dune",
      authors: "Frank Herbert",
      summary: "A struggle for control of a desert world.",
      categories: ["Science Fiction", "Fiction / Political"],
      infoUrl: "https://books.google.com/books?id=google-dune",
      thumbnailUrl: "https://books.google.com/books/content?id=google-dune",
    };
  });
  await core.ensureBookDetails(regularId, async () => {
    lookups += 1;
    return null;
  });

  const dune = suggestions(core, regularId).find((item) => item.title === "Dune");
  assert.ok(dune);
  assert.equal(lookups, 1);
  assert.equal(dune.coverUrl, "https://books.google.com/books/content?id=google-dune");
  assert.deepEqual(dune.details, {
    authors: "Frank Herbert",
    summary: "A struggle for control of a desert world.",
    categories: ["Science Fiction", "Fiction / Political"],
    infoUrl: "https://books.google.com/books?id=google-dune",
  });

  assert.equal(core.removeBookSuggestion({ sessionId: adminId, suggestionId: dune.id }).ok, true);
  const remaining = core.db.prepare("SELECT COUNT(*) AS count FROM book_suggestions WHERE google_books_id = ?")
    .get("google-dune") as { count: number };
  assert.equal(remaining.count, 0);
});

test("a failed book-details lookup is retried later", async () => {
  const { core, adminId } = adminSession();
  assert.equal(core.openBookClub(adminId).ok, true);
  assert.equal((await core.suggestMatchedBook(
    { sessionId: adminId, title: "Kindred" },
    async () => [{
      title: "Kindred",
      authors: "Octavia E. Butler",
      year: 1979,
      coverId: 7,
      editionKey: "OL7M",
      workKey: "/works/OL7W",
      isbns: ["9780807083697"],
    }],
  )).ok, true);
  await core.ensureBookDetails(adminId, async () => {
    throw new Error("offline");
  });
  assert.equal(suggestions(core, adminId)[0]?.details?.summary, null);
  await core.ensureBookDetails(adminId, async () => ({
    sourceId: "kindred",
    authors: "Octavia E. Butler",
    summary: "A modern woman is pulled into the antebellum past.",
    categories: ["Science Fiction"],
    infoUrl: null,
    thumbnailUrl: null,
  }));
  assert.equal(suggestions(core, adminId)[0]?.details?.authors, "Octavia E. Butler");
});

test("legacy details without an Open Library identity are not shown", () => {
  const { core, adminId } = adminSession();
  assert.equal(core.openBookClub(adminId).ok, true);
  assert.equal(core.suggestBook({ sessionId: adminId, title: "Dune" }).ok, true);
  core.db.prepare(
    `UPDATE book_suggestions
     SET google_books_id = 'unverified', book_authors = 'Wrong Author',
         book_summary = 'Wrong story', book_details_checked = 1`,
  ).run();
  assert.equal(suggestions(core, adminId)[0]?.details, null);
});

test("closing the call selects the book with the most votes", () => {
  const { core, adminId, regularId } = adminSession();
  assert.deepEqual(core.closeBookClub({ sessionId: regularId }), { ok: false, failure: { code: "not_an_admin" } });
  assert.deepEqual(core.closeBookClub({ sessionId: adminId }), { ok: false, failure: { code: "suggestions_closed" } });
  assert.equal(core.openBookClub(adminId).ok, true);
  assert.equal(core.suggestBook({ sessionId: adminId, title: "Dune" }).ok, true);
  assert.equal(core.suggestBook({ sessionId: adminId, title: "The Hobbit" }).ok, true);
  const tied = suggestions(core, adminId);
  const dune = tied.find((item) => item.title === "Dune");
  const hobbit = tied.find((item) => item.title === "The Hobbit");
  assert.ok(dune && hobbit);
  assert.equal(core.voteForBook({ sessionId: regularId, suggestionId: hobbit.id }).ok, true);
  assert.equal(core.voteForBook({ sessionId: adminId, suggestionId: hobbit.id }).ok, true);

  const closed = core.closeBookClub({ sessionId: adminId });
  assert.equal(closed.ok, true);
  if (!closed.ok) {
    return;
  }
  assert.equal(closed.value.selectedSuggestionId, hobbit.id);
  const rounds = core.bookClubRounds(regularId);
  assert.equal(rounds.ok, true);
  if (!rounds.ok) {
    return;
  }
  assert.equal(rounds.value[0]?.status, "suggestions_closed");
  assert.equal(rounds.value[0]?.selectedSuggestionId, hobbit.id);
  assert.deepEqual(core.suggestBook({ sessionId: regularId, title: "Kindred" }), {
    ok: false,
    failure: { code: "not_an_admin" },
  });
  assert.deepEqual(core.voteForBook({ sessionId: regularId, suggestionId: dune.id }), {
    ok: false,
    failure: { code: "suggestions_closed" },
  });
  assert.deepEqual(core.removeBookSuggestion({ sessionId: adminId, suggestionId: hobbit.id }), {
    ok: false,
    failure: { code: "suggestions_closed" },
  });
  assert.deepEqual(core.openBookClub(adminId), { ok: false, failure: { code: "book_already_selected" } });
});

test("a tie waits for the admin to choose, and closing an empty call selects nothing", () => {
  const { core, adminId, regularId } = adminSession();
  assert.equal(core.openBookClub(adminId).ok, true);
  const empty = core.closeBookClub({ sessionId: adminId });
  assert.equal(empty.ok, true);
  if (!empty.ok) {
    return;
  }
  assert.equal(empty.value.selectedSuggestionId, null);
  assert.equal(core.openBookClub(adminId).ok, true);
  assert.equal(core.suggestBook({ sessionId: adminId, title: "Dune" }).ok, true);
  assert.equal(core.suggestBook({ sessionId: adminId, title: "The Hobbit" }).ok, true);
  const rows = suggestions(core, adminId);
  const dune = rows.find((item) => item.title === "Dune");
  const hobbit = rows.find((item) => item.title === "The Hobbit");
  assert.ok(dune && hobbit);
  assert.deepEqual(core.closeBookClub({ sessionId: adminId }), { ok: false, failure: { code: "vote_tie" } });
  assert.equal(core.bookClubRounds(adminId).ok && core.bookClubRounds(adminId).ok, true);
  const stillOpen = core.bookClubRounds(adminId);
  assert.equal(stillOpen.ok, true);
  if (!stillOpen.ok) {
    return;
  }
  assert.equal(stillOpen.value[0]?.status, "open_for_suggestions");
  assert.equal(stillOpen.value[0]?.selectedSuggestionId, null);
  assert.deepEqual(core.closeBookClub({ sessionId: adminId, suggestionId: "missing" }), {
    ok: false,
    failure: { code: "not_in_the_tie" },
  });
  const chosen = core.closeBookClub({ sessionId: adminId, suggestionId: hobbit.id });
  assert.equal(chosen.ok, true);
  if (!chosen.ok) {
    return;
  }
  assert.equal(chosen.value.selectedSuggestionId, hobbit.id);
});

test("an admin starts over after a book is selected and the same club opens empty", () => {
  const { core, adminId, regularId } = adminSession();
  assert.deepEqual(core.startOver(adminId), { ok: false, failure: { code: "book_not_selected" } });
  assert.equal(core.openBookClub(adminId).ok, true);
  assert.deepEqual(core.startOver(adminId), { ok: false, failure: { code: "book_not_selected" } });
  assert.equal(core.suggestBook({ sessionId: adminId, title: "Dune" }).ok, true);
  assert.equal(core.suggestBook({ sessionId: adminId, title: "The Hobbit" }).ok, true);
  const before = suggestions(core, adminId);
  const hobbit = before.find((item) => item.title === "The Hobbit");
  assert.ok(hobbit);
  assert.equal(core.voteForBook({ sessionId: regularId, suggestionId: hobbit.id }).ok, true);
  assert.equal(core.closeBookClub({ sessionId: adminId }).ok, true);
  const closed = core.bookClubRounds(adminId);
  assert.equal(closed.ok, true);
  if (!closed.ok) {
    return;
  }
  const clubId = closed.value[0]?.id;
  assert.deepEqual(core.startOver(regularId), { ok: false, failure: { code: "not_an_admin" } });
  const restarted = core.startOver(adminId);
  assert.equal(restarted.ok, true);
  if (!restarted.ok) {
    return;
  }
  assert.equal(restarted.value.id, clubId);
  const rounds = core.bookClubRounds(regularId);
  assert.equal(rounds.ok, true);
  if (!rounds.ok) {
    return;
  }
  assert.equal(rounds.value[0]?.id, clubId);
  assert.equal(rounds.value[0]?.status, "open_for_suggestions");
  assert.equal(rounds.value[0]?.selectedSuggestionId, null);
  assert.deepEqual(rounds.value[0]?.suggestions, []);
  assert.equal(core.suggestBook({ sessionId: adminId, title: "The Hobbit" }).ok, true);
  const again = suggestions(core, regularId);
  assert.equal(again.length, 1);
  assert.equal(again[0]?.title, "The Hobbit");
  assert.equal(again[0]?.votes, 0);
  assert.equal(core.voteForBook({ sessionId: regularId, suggestionId: again[0]?.id ?? "" }).ok, true);
});

test("several matching books wait for a choice, and one match is saved immediately", async () => {
  const { core, adminId, regularId } = adminSession();
  assert.equal(core.openBookClub(adminId).ok, true);
  const several = [
    { title: "Born to Run", authors: "Bruce Springsteen", year: 1975, coverId: 1, editionKey: "OL1M", workKey: "/works/OL1W", isbns: ["9781501141515"] },
    { title: "Born to Run", authors: "Christopher McDougall", year: 2009, coverId: 2, editionKey: "OL2M", workKey: "/works/OL2W", isbns: ["9780307279187"] },
  ];
  assert.deepEqual(
    await core.suggestMatchedBook({ sessionId: regularId, title: "Born to Run" }, async () => several),
    { ok: false, failure: { code: "not_an_admin" } },
  );
  const pending = await core.suggestMatchedBook({ sessionId: adminId, title: "Born to Run" }, async () => several);
  assert.equal(pending.ok, true);
  if (!pending.ok) {
    return;
  }
  assert.deepEqual(pending.value.matches, several);
  assert.deepEqual(suggestions(core, regularId), []);
  assert.deepEqual(
    await core.suggestMatchedBook({ sessionId: adminId, title: "Born to Run", coverId: 9 }, async () => several),
    { ok: false, failure: { code: "match_not_offered" } },
  );
  assert.equal(suggestions(core, regularId).length, 0);
  const chosen = await core.suggestMatchedBook(
    { sessionId: adminId, title: "  Born   to Run " },
    async () => several,
  );
  assert.equal(chosen.ok, true);
  if (chosen.ok && chosen.value.matches) {
    const picked = await core.suggestMatchedBook(
      { sessionId: adminId, title: "Born to Run", coverId: 2 },
      async () => several,
    );
    assert.equal(picked.ok, true);
  }
  const rows = suggestions(core, regularId);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.title, "Born to Run");
  assert.equal(rows[0]?.coverId, 2);

  const only = await core.suggestMatchedBook(
    { sessionId: adminId, title: "Dune" },
    async () => [{ title: "Dune", authors: "Frank Herbert", year: 1965, coverId: 5, editionKey: "OL5M", workKey: "/works/OL5W", isbns: ["9780441172719"] }],
  );
  assert.equal(only.ok, true);
  assert.equal(suggestions(core, regularId).find((item) => item.title === "Dune")?.coverId, 5);

  const none = await core.suggestMatchedBook({ sessionId: adminId, title: "Not A Real Book Zzq" }, async () => []);
  assert.equal(none.ok, true);
  assert.equal(suggestions(core, adminId).find((item) => item.title === "Not A Real Book Zzq")?.coverId, null);
  await core.ensureBookCovers(adminId, async () => 99);
  assert.equal(suggestions(core, adminId).find((item) => item.title === "Not A Real Book Zzq")?.coverId, null);

  assert.deepEqual(
    await core.suggestMatchedBook({ sessionId: adminId, title: "Kindred" }, async () => {
      throw new Error("offline");
    }),
    { ok: false, failure: { code: "book_search_failed" } },
  );
  assert.equal(suggestions(core, regularId).some((item) => item.title === "Kindred"), false);
  assert.deepEqual(
    await core.suggestMatchedBook({ sessionId: adminId, title: "Born to Run", coverId: 1 }, async () => several),
    { ok: false, failure: { code: "already_suggested" } },
  );
});

test("members can vote for every meeting time, and a tie waits for the admin", () => {
  const { core, adminId, regularId } = adminSession();
  assert.deepEqual(core.proposeMeetingTime({ sessionId: adminId, startsAt: "2026-10-13T19:00" }), {
    ok: false,
    failure: { code: "book_not_selected" },
  });
  assert.equal(core.openBookClub(adminId).ok, true);
  assert.equal(core.suggestBook({ sessionId: adminId, title: "The Hobbit" }).ok, true);
  assert.equal(core.closeBookClub({ sessionId: adminId }).ok, true);
  assert.deepEqual(core.proposeMeetingTime({ sessionId: regularId, startsAt: "2026-10-13T19:00" }), {
    ok: false,
    failure: { code: "not_an_admin" },
  });
  assert.deepEqual(core.proposeMeetingTime({ sessionId: adminId, startsAt: "tomorrow" }), {
    ok: false,
    failure: { code: "meeting_time_invalid" },
  });
  assert.equal(core.proposeMeetingTime({ sessionId: adminId, startsAt: "2026-10-13T19:00" }).ok, true);
  assert.deepEqual(core.proposeMeetingTime({ sessionId: adminId, startsAt: "2026-10-13T19:00" }), {
    ok: false,
    failure: { code: "meeting_time_taken" },
  });
  assert.equal(core.proposeMeetingTime({ sessionId: adminId, startsAt: "2026-10-20T19:00" }).ok, true);
  const openRound = core.bookClubRounds(adminId);
  assert.equal(openRound.ok, true);
  if (!openRound.ok) {
    return;
  }
  const first = openRound.value[0]?.meetingTimes.find((time) => time.startsAt === "2026-10-13T19:00");
  const second = openRound.value[0]?.meetingTimes.find((time) => time.startsAt === "2026-10-20T19:00");
  assert.ok(first && second);
  assert.equal(core.voteForMeetingTime({ sessionId: regularId, meetingTimeId: first.id }).ok, true);
  assert.equal(core.voteForMeetingTime({ sessionId: regularId, meetingTimeId: second.id }).ok, true);
  assert.equal(core.voteForMeetingTime({ sessionId: adminId, meetingTimeId: first.id }).ok, true);
  const voted = core.bookClubRounds(regularId);
  assert.equal(voted.ok, true);
  if (!voted.ok) {
    return;
  }
  assert.deepEqual(
    voted.value[0]?.meetingTimes.map((time) => ({ startsAt: time.startsAt, votes: time.votes, votedByMe: time.votedByMe })),
    [
      { startsAt: "2026-10-13T19:00", votes: 2, votedByMe: true },
      { startsAt: "2026-10-20T19:00", votes: 1, votedByMe: true },
    ],
  );
  assert.equal(core.withdrawMeetingVote({ sessionId: regularId, meetingTimeId: second.id }).ok, true);
  assert.equal(core.removeMeetingTime({ sessionId: adminId, meetingTimeId: second.id }).ok, true);
  assert.equal(core.bookClubRounds(adminId).ok, true);
  const afterRemoval = core.bookClubRounds(adminId);
  assert.equal(afterRemoval.ok, true);
  if (!afterRemoval.ok) {
    return;
  }
  assert.equal(afterRemoval.value[0]?.meetingTimes.length, 1);
  assert.equal(core.proposeMeetingTime({ sessionId: adminId, startsAt: "2026-10-20T19:00" }).ok, true);
  const tiedRound = core.bookClubRounds(adminId);
  assert.equal(tiedRound.ok, true);
  if (!tiedRound.ok) {
    return;
  }
  const restored = tiedRound.value[0]?.meetingTimes.find((time) => time.startsAt === "2026-10-20T19:00");
  assert.ok(restored);
  assert.equal(core.voteForMeetingTime({ sessionId: regularId, meetingTimeId: restored.id }).ok, true);
  assert.equal(core.withdrawMeetingVote({ sessionId: adminId, meetingTimeId: first.id }).ok, true);
  assert.deepEqual(core.selectMeetingTime({ sessionId: adminId }), { ok: false, failure: { code: "meeting_tie" } });
  assert.deepEqual(core.selectMeetingTime({ sessionId: adminId, meetingTimeId: "missing" }), {
    ok: false,
    failure: { code: "not_in_the_meeting_tie" },
  });
  const selected = core.selectMeetingTime({ sessionId: adminId, meetingTimeId: restored.id });
  assert.equal(selected.ok, true);
  const finished = core.bookClubRounds(regularId);
  assert.equal(finished.ok, true);
  if (!finished.ok) {
    return;
  }
  assert.equal(finished.value[0]?.selectedMeetingTimeId, restored.id);
  assert.deepEqual(core.voteForMeetingTime({ sessionId: regularId, meetingTimeId: first.id }), {
    ok: false,
    failure: { code: "meeting_already_selected" },
  });
  assert.deepEqual(core.proposeMeetingTime({ sessionId: adminId, startsAt: "2026-10-27T19:00" }), {
    ok: false,
    failure: { code: "meeting_already_selected" },
  });
  const clubId = finished.value[0]?.id;
  assert.equal(core.startOver(adminId).ok, true);
  const restarted = core.bookClubRounds(adminId);
  assert.equal(restarted.ok, true);
  if (!restarted.ok) {
    return;
  }
  assert.equal(restarted.value[0]?.id, clubId);
  assert.equal(restarted.value[0]?.status, "open_for_suggestions");
  assert.equal(restarted.value[0]?.selectedSuggestionId, null);
  assert.equal(restarted.value[0]?.selectedMeetingTimeId, null);
  assert.deepEqual(restarted.value[0]?.meetingTimes, []);
  assert.deepEqual(restarted.value[0]?.suggestions, []);
});

function counts(item: { title: string; votes: number; votedByMe: boolean }) {
  return { title: item.title, votes: item.votes, votedByMe: item.votedByMe };
}
