export type CatalogBook = {
  title: string;
  authors: string;
  year: number | null;
  coverId: number;
  editionKey: string | null;
  workKey: string | null;
  isbns: string[];
};

export async function findOpenLibraryBooks(
  title: string,
  request: typeof fetch = fetch,
): Promise<CatalogBook[]> {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("title", title);
  url.searchParams.set("limit", "5");
  url.searchParams.set("fields", "key,title,author_name,first_publish_year,cover_i,cover_edition_key,isbn");
  const response = await request(url, {
    headers: { "User-Agent": "BookClub/1.0 (local club cover lookup)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(`Open Library returned ${response.status}`);
  }
  const body = await response.json() as {
    docs?: {
      title?: string;
      author_name?: string[];
      first_publish_year?: number;
      cover_i?: number;
      cover_edition_key?: string;
      key?: string;
      isbn?: string[];
    }[];
  };
  const seen = new Set<number>();
  const books: CatalogBook[] = [];
  for (const doc of body.docs ?? []) {
    if (!Number.isInteger(doc.cover_i) || seen.has(doc.cover_i!)) {
      continue;
    }
    seen.add(doc.cover_i!);
    const authors = (doc.author_name ?? []).filter((name) => name.trim()).join(", ");
    books.push({
      title: doc.title?.trim() || title,
      authors,
      year: Number.isInteger(doc.first_publish_year) ? doc.first_publish_year! : null,
      coverId: doc.cover_i!,
      editionKey: validEditionKey(doc.cover_edition_key),
      workKey: validWorkKey(doc.key),
      isbns: cleanIsbns(doc.isbn),
    });
  }
  return books;
}

export async function findOpenLibraryEditionIsbn(
  editionKey: string,
  request: typeof fetch = fetch,
): Promise<string | null> {
  const key = validEditionKey(editionKey);
  if (!key) {
    return null;
  }
  const response = await request(`https://openlibrary.org/books/${key}.json`, {
    headers: { "User-Agent": "BookClub/1.0 (local club edition lookup)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(`Open Library returned ${response.status}`);
  }
  const body = await response.json() as { isbn_13?: string[]; isbn_10?: string[] };
  return firstIsbn(body.isbn_13) ?? firstIsbn(body.isbn_10);
}

export async function findOpenLibraryCoverId(title: string): Promise<number | null> {
  const books = await findOpenLibraryBooks(title);
  return books[0]?.coverId ?? null;
}

function validEditionKey(value: string | undefined): string | null {
  const key = value?.trim() ?? "";
  return /^OL\d+M$/.test(key) ? key : null;
}

function validWorkKey(value: string | undefined): string | null {
  const key = value?.trim() ?? "";
  return /^\/works\/OL\d+W$/.test(key) ? key : null;
}

function cleanIsbns(values: string[] | undefined): string[] {
  const unique = new Set<string>();
  for (const value of values ?? []) {
    const isbn = normalizedIsbn(value);
    if (isbn) unique.add(isbn);
  }
  return [...unique].slice(0, 500);
}

function firstIsbn(values: string[] | undefined): string | null {
  for (const value of values ?? []) {
    const isbn = normalizedIsbn(value);
    if (isbn) return isbn;
  }
  return null;
}

function normalizedIsbn(value: string): string | null {
  const isbn = value.replaceAll(/[^0-9X]/gi, "").toUpperCase();
  return /^(?:\d{13}|\d{9}[\dX])$/.test(isbn) ? isbn : null;
}
