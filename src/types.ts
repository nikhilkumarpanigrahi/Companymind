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

export type DocumentItem = {
  _id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  createdAt: string;
};

export type CategoryStat = {
  name: string;
  count: number;
};

export type TagStat = {
  name: string;
  count: number;
};

export type RecentDoc = {
  _id: string;
  title: string;
  category?: string;
  createdAt: string;
};

export type StatsData = {
  totalDocuments: number;
  categories: CategoryStat[];
  topTags: TagStat[];
  recentDocuments: RecentDoc[];
};
