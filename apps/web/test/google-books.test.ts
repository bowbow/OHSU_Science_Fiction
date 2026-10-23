import assert from "node:assert/strict";
import { test } from "node:test";
import { findGoogleBookDetails } from "../src/google-books.ts";

test("Google Books returns only the volume with the selected edition's ISBN", async () => {
  let requestedUrl: URL | null = null;
  let requestedKey: string | null = null;
  const request = (async (input: string | URL | Request, init?: RequestInit) => {
    requestedUrl = new URL(input instanceof Request ? input.url : input.toString());
    requestedKey = new Headers(init?.headers).get("x-goog-api-key");
    return new Response(JSON.stringify({
      items: [
        {
          id: "cookbook",
          volumeInfo: {
            title: "The Dune Cookbook",
            authors: ["Someone Else"],
            description: "Recipes.",
            industryIdentifiers: [{ type: "ISBN_13", identifier: "9780000000002" }],
          },
        },
        {
          id: "dune",
          volumeInfo: {
            title: "Dune",
            authors: ["Frank Herbert"],
            description: "<p>A struggle for <strong>control</strong> of Arrakis.</p>",
            categories: ["Fiction / Science Fiction / General", "Fiction / Political"],
            industryIdentifiers: [{ type: "ISBN_13", identifier: "9780441172719" }],
            infoLink: "http://books.google.com/books?id=dune",
            imageLinks: { thumbnail: "http://books.google.com/books/content?id=dune" },
          },
        },
      ],
    }), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;

  const details = await findGoogleBookDetails(
    "Dune",
    "Frank Herbert",
    "978-0-441-17271-9",
    ["9780441172719"],
    "secret-key",
    request,
  );
  const observedUrl = requestedUrl as URL | null;
  assert.ok(observedUrl);
  assert.equal(observedUrl.searchParams.has("key"), false);
  assert.equal(observedUrl.searchParams.get("q"), "isbn:9780441172719");
  assert.equal(
    observedUrl.searchParams.get("fields"),
    "items(id,volumeInfo(title,authors,description,categories,industryIdentifiers(type,identifier),infoLink,imageLinks(thumbnail,smallThumbnail)))",
  );
  assert.equal(requestedKey, "secret-key");
  assert.deepEqual(details, {
    sourceId: "dune",
    authors: "Frank Herbert",
    summary: "A struggle for control of Arrakis.",
    categories: ["Fiction / Science Fiction / General", "Fiction / Political"],
    infoUrl: "https://books.google.com/books?id=dune",
    thumbnailUrl: "https://books.google.com/books/content?id=dune",
  });
});

test("Google Books rejects untrusted links and returns null when no book matches", async () => {
  const malicious = (async () => new Response(JSON.stringify({
    items: [{
      id: "safe-data",
      volumeInfo: {
        title: "Dune",
        industryIdentifiers: [{ type: "ISBN_13", identifier: "9780441172719" }],
        infoLink: "javascript:alert(1)",
        imageLinks: { thumbnail: "https://example.com/cover.jpg" },
      },
    }],
  }), { status: 200 })) as typeof fetch;
  const details = await findGoogleBookDetails(
    "Dune",
    "Frank Herbert",
    "9780441172719",
    ["9780441172719"],
    "secret-key",
    malicious,
  );
  assert.equal(details?.infoUrl, null);
  assert.equal(details?.thumbnailUrl, null);

  const empty = (async () => new Response(JSON.stringify({ totalItems: 0 }), { status: 200 })) as typeof fetch;
  assert.equal(await findGoogleBookDetails("Dune", "Frank Herbert", null, [], "secret-key", empty), null);
});

test("Google Books fallback accepts only an ISBN from the selected Open Library work", async () => {
  const queries: string[] = [];
  const request = (async (input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    queries.push(url.searchParams.get("q") ?? "");
    if (queries.length === 1) {
      return new Response(JSON.stringify({ totalItems: 0 }), { status: 200 });
    }
    return new Response(JSON.stringify({
      items: [
        {
          id: "dune-messiah",
          volumeInfo: {
            title: "Dune Messiah",
            description: "The sequel.",
            industryIdentifiers: [{ type: "ISBN_13", identifier: "9780593098233" }],
          },
        },
        {
          id: "dune-work-edition",
          volumeInfo: {
            title: "Dune",
            authors: ["Frank Herbert"],
            description: "The desert planet Arrakis changes an empire.",
            industryIdentifiers: [{ type: "ISBN_13", identifier: "9780441013593" }],
          },
        },
      ],
    }), { status: 200 });
  }) as typeof fetch;

  const details = await findGoogleBookDetails(
    "Dune",
    "Frank Herbert",
    "9781444738209",
    ["9781444738209", "9780441013593"],
    "secret-key",
    request,
  );
  assert.deepEqual(queries, ["isbn:9781444738209", "Dune inauthor:Frank Herbert"]);
  assert.equal(details?.sourceId, "dune-work-edition");
  assert.equal(details?.summary, "The desert planet Arrakis changes an empire.");
});
