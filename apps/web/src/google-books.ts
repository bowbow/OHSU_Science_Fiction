import type { BookDetails } from "@bookclub/core";

type GoogleVolume = {
  id?: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    description?: string;
    categories?: string[];
    industryIdentifiers?: { type?: string; identifier?: string }[];
    infoLink?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
};

type GoogleVolumesResponse = { items?: GoogleVolume[] };

export function createGoogleBooksLookup(
  apiKey: string,
  request: typeof fetch = fetch,
): (title: string, authors: string, editionIsbn: string | null, workIsbns: string[]) => Promise<BookDetails | null> {
  const key = apiKey.trim();
  if (!key) {
    throw new Error("A Google Books API key is required.");
  }
  return (title, authors, editionIsbn, workIsbns) => findGoogleBookDetails(
    title,
    authors,
    editionIsbn,
    workIsbns,
    key,
    request,
  );
}

export async function findGoogleBookDetails(
  title: string,
  authors: string,
  editionIsbn: string | null,
  workIsbns: string[],
  apiKey: string,
  request: typeof fetch = fetch,
): Promise<BookDetails | null> {
  const exactIsbn = editionIsbn ? normalizedIsbn(editionIsbn) : null;
  const allowedIsbns = new Set(
    [exactIsbn, ...workIsbns.map(normalizedIsbn)].filter((isbn): isbn is string => isbn !== null),
  );
  if (allowedIsbns.size === 0) {
    return null;
  }

  let volumes = exactIsbn ? await search(`isbn:${exactIsbn}`, 5, apiKey, request) : [];
  let chosen = bestAllowedVolume(volumes, allowedIsbns);
  if (!chosen) {
    const cleanTitle = title.trim().replaceAll('"', " ");
    const cleanAuthors = authors.trim().replaceAll('"', " ");
    if (!cleanTitle) return null;
    const query = `${cleanTitle}${cleanAuthors ? ` inauthor:${cleanAuthors}` : ""}`;
    volumes = await search(query, 10, apiKey, request);
    chosen = bestAllowedVolume(volumes, allowedIsbns);
  }
  const info = chosen?.volumeInfo;
  if (!chosen?.id || !info) {
    return null;
  }

  return {
    sourceId: chosen.id,
    authors: cleanStrings(info.authors).join(", "),
    summary: info.description ? plainText(info.description) || null : null,
    categories: cleanStrings(info.categories),
    infoUrl: safeGoogleUrl(info.infoLink),
    thumbnailUrl: safeGoogleUrl(info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail),
  };
}

async function search(
  query: string,
  maxResults: number,
  apiKey: string,
  request: typeof fetch,
): Promise<GoogleVolume[]> {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("printType", "books");
  url.searchParams.set(
    "fields",
    "items(id,volumeInfo(title,authors,description,categories,industryIdentifiers(type,identifier),infoLink,imageLinks(thumbnail,smallThumbnail)))",
  );
  const response = await request(url, {
    headers: { "x-goog-api-key": apiKey },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(`Google Books returned ${response.status}`);
  }
  const body = await response.json() as GoogleVolumesResponse;
  return Array.isArray(body.items) ? body.items : [];
}

function cleanStrings(values: string[] | undefined): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  return [...new Set(values.map((value) => value.trim().replaceAll(/\s+/g, " ")).filter(Boolean))];
}

function volumeHasAllowedIsbn(volume: GoogleVolume, allowedIsbns: Set<string>): boolean {
  return (volume.volumeInfo?.industryIdentifiers ?? [])
    .some((identifier) => {
      const isbn = normalizedIsbn(identifier.identifier ?? "");
      return isbn !== null && allowedIsbns.has(isbn);
    });
}

function bestAllowedVolume(volumes: GoogleVolume[], allowedIsbns: Set<string>): GoogleVolume | undefined {
  return volumes
    .filter((volume) => volumeHasAllowedIsbn(volume, allowedIsbns))
    .sort((left, right) => Number(Boolean(right.volumeInfo?.description)) - Number(Boolean(left.volumeInfo?.description)))[0];
}

function normalizedIsbn(value: string): string | null {
  const isbn = value.replaceAll(/[^0-9X]/gi, "").toUpperCase();
  return /^(?:\d{13}|\d{9}[\dX])$/.test(isbn) ? isbn : null;
}

function safeGoogleUrl(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    const trusted = url.hostname === "books.google.com"
      || url.hostname === "www.google.com"
      || url.hostname.endsWith(".googleusercontent.com");
    if (!trusted || (url.protocol !== "http:" && url.protocol !== "https:")) {
      return null;
    }
    url.protocol = "https:";
    return url.toString();
  } catch {
    return null;
  }
}

function plainText(html: string): string {
  return decodeEntities(
    html
      .replaceAll(/<br\s*\/?>/gi, "\n")
      .replaceAll(/<\/p\s*>/gi, "\n\n")
      .replaceAll(/<[^>]+>/g, " "),
  ).replaceAll(/[ \t]+/g, " ").replaceAll(/\n\s+/g, "\n").replaceAll(/\n{3,}/g, "\n\n").trim().slice(0, 6000);
}

function decodeEntities(value: string): string {
  return value.replaceAll(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (entity, code: string) => {
    const named: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" };
    const lower = code.toLocaleLowerCase();
    if (named[lower]) return named[lower];
    const number = lower.startsWith("#x") ? Number.parseInt(lower.slice(2), 16) : Number.parseInt(lower.slice(1), 10);
    return Number.isInteger(number) && number >= 0 && number <= 0x10ffff ? String.fromCodePoint(number) : entity;
  });
}
