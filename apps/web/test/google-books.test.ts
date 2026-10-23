import assert from "node:assert/strict";
import { test } from "node:test";
import { findGoogleBookDetails } from "../src/google-books.ts";

test("Google Books details favor the requested book and keep the API key out of the URL", async () => {
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
          },
        },
        {
          id: "dune",
          volumeInfo: {
            title: "Dune",
            authors: ["Frank Herbert"],
            description: "<p>A struggle for <strong>control</strong> of Arrakis.</p>",
            categories: ["Fiction / Science Fiction / General", "Fiction / Political"],
            averageRating: 4.5,
            ratingsCount: 321,
            infoLink: "http://books.google.com/books?id=dune",
            imageLinks: { thumbnail: "http://books.google.com/books/content?id=dune" },
          },
        },
      ],
    }), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;

  const details = await findGoogleBookDetails("Dune", "Frank Herbert", "secret-key", request);
  const observedUrl = requestedUrl as URL | null;
  assert.ok(observedUrl);
  assert.equal(observedUrl.searchParams.has("key"), false);
  assert.equal(observedUrl.searchParams.get("q"), "Dune inauthor:Frank Herbert");
  assert.equal(requestedKey, "secret-key");
  assert.deepEqual(details, {
    sourceId: "dune",
    authors: "Frank Herbert",
    summary: "A struggle for control of Arrakis.",
    categories: ["Fiction / Science Fiction / General", "Fiction / Political"],
    averageRating: 4.5,
    ratingsCount: 321,
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
        infoLink: "javascript:alert(1)",
        imageLinks: { thumbnail: "https://example.com/cover.jpg" },
      },
    }],
  }), { status: 200 })) as typeof fetch;
  const details = await findGoogleBookDetails("Dune", "", "secret-key", malicious);
  assert.equal(details?.infoUrl, null);
  assert.equal(details?.thumbnailUrl, null);

  const empty = (async () => new Response(JSON.stringify({ totalItems: 0 }), { status: 200 })) as typeof fetch;
  assert.equal(await findGoogleBookDetails("Unknown", "", "secret-key", empty), null);
});
