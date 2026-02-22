export type SearchResultItem = {
  id?: string;
  title: string;
  snippet: string;
  relevanceScore: number;
};

export type SearchResponse = {
  results: SearchResultItem[];
  total: number;
  page: number;
  pageSize: number;
  tookMs?: number;
};

export type RAGSource = {
  id?: string;
  title: string;
  snippet: string;
  relevanceScore: number;
};

export type RAGResponse = {
  success: boolean;
  answer: string;
  sources: RAGSource[];
  meta: {
    model: string;
    tokensUsed: number;
    sourcesUsed: number;
    tookMs: number;
  };
};

export type AddDocumentPayload = {
  title: string;
  content: string;
};
