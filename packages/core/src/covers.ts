export type CatalogBook = {
  title: string;
  authors: string;
  year: number | null;
  coverId: number;
};

export async function findOpenLibraryBooks(title: string): Promise<CatalogBook[]> {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("title", title);
  url.searchParams.set("limit", "5");
  url.searchParams.set("fields", "title,author_name,first_publish_year,cover_i");
  const response = await fetch(url, {
    headers: { "User-Agent": "BookClub/1.0 (local club cover lookup)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(`Open Library returned ${response.status}`);
  }
  const body = await response.json() as {
    docs?: { title?: string; author_name?: string[]; first_publish_year?: number; cover_i?: number }[];
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
    });
  }
  return books;
}

export async function findOpenLibraryCoverId(title: string): Promise<number | null> {
  const books = await findOpenLibraryBooks(title);
  return books[0]?.coverId ?? null;
}
