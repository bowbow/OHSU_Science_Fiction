import type { BookDetails } from "@bookclub/core";

type GoogleVolume = {
  id?: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    description?: string;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    infoLink?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
};

type GoogleVolumesResponse = { items?: GoogleVolume[] };

export function createGoogleBooksLookup(
  apiKey: string,
  request: typeof fetch = fetch,
): (title: string, authors: string) => Promise<BookDetails | null> {
  const key = apiKey.trim();
  if (!key) {
    throw new Error("A Google Books API key is required.");
  }
  return (title, authors) => findGoogleBookDetails(title, authors, key, request);
}

export async function findGoogleBookDetails(
  title: string,
  authors: string,
  apiKey: string,
  request: typeof fetch = fetch,
): Promise<BookDetails | null> {
  const cleanTitle = title.trim().replaceAll(/\s+/g, " ");
  const cleanAuthors = authors.trim().replaceAll(/\s+/g, " ");
  if (!cleanTitle) {
    return null;
  }

  let volumes = await search(cleanTitle, cleanAuthors, apiKey, request);
  if (volumes.length === 0 && cleanAuthors) {
    volumes = await search(cleanTitle, "", apiKey, request);
  }
  const chosen = ranked(volumes, cleanTitle, cleanAuthors)[0];
  const info = chosen?.volumeInfo;
  if (!chosen?.id || !info) {
    return null;
  }

  return {
    sourceId: chosen.id,
    authors: cleanStrings(info.authors).join(", "),
    summary: info.description ? plainText(info.description) || null : null,
    categories: cleanStrings(info.categories),
    averageRating: validRating(info.averageRating),
    ratingsCount: validCount(info.ratingsCount),
    infoUrl: safeGoogleUrl(info.infoLink),
    thumbnailUrl: safeGoogleUrl(info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail),
  };
}

async function search(
  title: string,
  authors: string,
  apiKey: string,
  request: typeof fetch,
): Promise<GoogleVolume[]> {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  const titleTerm = title.replaceAll('"', " ");
  const authorTerm = authors.replaceAll('"', " ");
  url.searchParams.set("q", `${titleTerm}${authorTerm ? ` inauthor:${authorTerm}` : ""}`);
  url.searchParams.set("maxResults", "5");
  url.searchParams.set("printType", "books");
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

function ranked(volumes: GoogleVolume[], title: string, authors: string): GoogleVolume[] {
  const wantedTitle = normalized(title);
  const wantedAuthors = normalized(authors);
  return [...volumes].sort((left, right) => score(right) - score(left));

  function score(volume: GoogleVolume): number {
    const info = volume.volumeInfo;
    const foundTitle = normalized(info?.title ?? "");
    const foundAuthors = normalized(cleanStrings(info?.authors).join(" "));
    let value = foundTitle === wantedTitle
      ? 100
      : foundTitle && (foundTitle.includes(wantedTitle) || wantedTitle.includes(foundTitle)) ? 45 : 0;
    if (wantedAuthors && foundAuthors.includes(wantedAuthors)) value += 35;
    if (info?.description) value += 12;
    if (cleanStrings(info?.categories).length > 0) value += 6;
    if (validRating(info?.averageRating) !== null) value += 4;
    if (info?.imageLinks?.thumbnail || info?.imageLinks?.smallThumbnail) value += 2;
    return value;
  }
}

function cleanStrings(values: string[] | undefined): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  return [...new Set(values.map((value) => value.trim().replaceAll(/\s+/g, " ")).filter(Boolean))];
}

function normalized(value: string): string {
  return value.trim().replaceAll(/[^\p{L}\p{N}]+/gu, " ").toLocaleLowerCase();
}

function validRating(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 5 ? value : null;
}

function validCount(value: number | undefined): number | null {
  return Number.isInteger(value) && value! >= 0 ? value! : null;
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
