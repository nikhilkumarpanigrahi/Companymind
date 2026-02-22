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
  category?: string;
  tags?: string[];
};

export type ConversationMessage = {
  role: 'user' | 'assistant';
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

export type QueryLogEntry = {
  query: string;
  type: string;
  timestamp: string;
  tookMs: number;
};

export type AnalyticsData = {
  totalQueries: number;
  askCount: number;
  searchCount: number;
  avgResponseTime: number;
  popularQueries: { query: string; count: number }[];
  recentQueries: QueryLogEntry[];
};

/* ── Benchmark types ───────────────────────────────────── */

export type BenchmarkResultItem = {
  id: string;
  title: string;
  snippet: string;
  score: number;
};

export type BenchmarkMethodResult = {
  method: string;
  description: string;
  mongoFeature: string;
  results: BenchmarkResultItem[];
  count: number;
  latencyMs: number;
  embeddingLatencyMs?: number;
};

export type BenchmarkMethodSummary = {
  key: string;
  method: string;
  latencyMs: number;
  resultCount: number;
  avgScore: number;
};

export type BenchmarkOverlapCell = {
  count: number;
  pct: number;
};

export type BenchmarkSummary = {
  query: string;
  limit: number;
  totalEmbeddingMs: number;
  methods: BenchmarkMethodSummary[];
  overlap: Record<string, Record<string, BenchmarkOverlapCell>>;
};

export type BenchmarkResponse = {
  success: boolean;
  summary: BenchmarkSummary;
  methods: Record<string, BenchmarkMethodResult>;
};
