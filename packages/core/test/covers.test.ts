import assert from "node:assert/strict";
import { test } from "node:test";
import { findOpenLibraryBooks, findOpenLibraryEditionIsbn } from "../src/covers.ts";

test("Open Library matches retain the exact cover edition key", async () => {
  let requestedUrl: URL | null = null;
  const request = (async (input: string | URL | Request) => {
    requestedUrl = new URL(input instanceof Request ? input.url : input.toString());
    return new Response(JSON.stringify({
      docs: [
        {
          title: "Dune",
          author_name: ["Frank Herbert"],
          first_publish_year: 1965,
          cover_i: 11481354,
          cover_edition_key: "OL32848840M",
          key: "/works/OL893414W",
          isbn: ["978-1-4447-3820-9", "1444738208"],
        },
      ],
    }), { status: 200 });
  }) as typeof fetch;

  assert.deepEqual(await findOpenLibraryBooks("Dune", request), [{
    title: "Dune",
    authors: "Frank Herbert",
    year: 1965,
    coverId: 11481354,
    editionKey: "OL32848840M",
    workKey: "/works/OL893414W",
    isbns: ["9781444738209", "1444738208"],
  }]);
  const observedUrl = requestedUrl as URL | null;
  assert.ok(observedUrl);
  assert.equal(observedUrl.searchParams.get("title"), "Dune");
  assert.match(observedUrl.searchParams.get("fields") ?? "", /cover_edition_key/);
});

test("an Open Library edition resolves to a normalized ISBN", async () => {
  let requestedUrl = "";
  const request = (async (input: string | URL | Request) => {
    requestedUrl = input instanceof Request ? input.url : input.toString();
    return new Response(JSON.stringify({ isbn_13: ["978-1-4447-3820-9"] }), { status: 200 });
  }) as typeof fetch;

  assert.equal(await findOpenLibraryEditionIsbn("OL32848840M", request), "9781444738209");
  assert.equal(requestedUrl, "https://openlibrary.org/books/OL32848840M.json");
  assert.equal(await findOpenLibraryEditionIsbn("../wrong", request), null);
});
