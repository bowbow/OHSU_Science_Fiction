export type BookDetails = {
  sourceId: string;
  authors: string;
  summary: string | null;
  categories: string[];
  infoUrl: string | null;
  thumbnailUrl: string | null;
};

export type BookDetailsView = Omit<BookDetails, "sourceId" | "thumbnailUrl">;
