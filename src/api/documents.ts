import { apiClient } from './client';
import type { AddDocumentPayload, AnalyticsData, BenchmarkResponse, ConversationMessage, DocumentItem, RAGResponse, SearchResponse, SearchResultItem, StatsData } from '../types';

type RawSearchResponse = {
  data?: SearchResultItem[];
  results?: SearchResultItem[];
  total?: number;
  page?: number;
  pageSize?: number;
  tookMs?: number;
};

const toSafeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

export const searchDocuments = async (
  query: string,
  page: number,
  pageSize: number
): Promise<SearchResponse> => {
  const { data } = await apiClient.get<RawSearchResponse>('/search', {
    params: {
      q: query,
      page,
      pageSize,
    },
  });

  const results = (data.results || data.data || []).map((item) => ({
    id: item.id,
    title: item.title || 'Untitled',
    snippet: item.snippet || '',
    relevanceScore: toSafeNumber(item.relevanceScore, 0),
  }));

  return {
    results,
    total: toSafeNumber(data.total, results.length),
    page: toSafeNumber(data.page, page),
    pageSize: toSafeNumber(data.pageSize, pageSize),
    tookMs: toSafeNumber(data.tookMs),
  };
};

export const askQuestion = async (question: string): Promise<RAGResponse> => {
  const { data } = await apiClient.post<RAGResponse>('/ask', { question }, { timeout: 30000 });
  return data;
};

/**
 * Stream an AI answer via SSE.
 * Calls POST /ask/stream with question + conversation history.
 * onToken is called for each token chunk; onDone when complete.
 */
export const askQuestionStream = (
  question: string,
  conversationHistory: ConversationMessage[],
  callbacks: {
    onToken: (token: string) => void;
    onSources: (sources: RAGResponse['sources']) => void;
    onDone: (meta: RAGResponse['meta'], fullAnswer: string) => void;
    onError: (error: string) => void;
  }
): (() => void) => {
  const controller = new AbortController();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  (async () => {
    try {
      const response = await fetch(`${API_BASE}/ask/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, conversationHistory }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        callbacks.onError('Failed to connect to AI stream');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            if (parsed.type === 'token') callbacks.onToken(parsed.content);
            else if (parsed.type === 'sources') callbacks.onSources(parsed.sources);
            else if (parsed.type === 'done') callbacks.onDone(parsed.meta, parsed.fullAnswer);
          } catch { /* skip */ }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        callbacks.onError('AI stream failed. Check your connection.');
      }
    }
  })();

  return () => controller.abort();
};

export const addDocument = async (payload: AddDocumentPayload): Promise<void> => {
  await apiClient.post('/documents', payload);
};

export const fetchDocuments = async (limit = 100): Promise<DocumentItem[]> => {
  const { data } = await apiClient.get<{ success: boolean; count: number; data: DocumentItem[] }>('/documents', {
    params: { limit },
  });
  return data.data;
};

export const fetchStats = async (): Promise<StatsData> => {
  const { data } = await apiClient.get<{ success: boolean; data: StatsData }>('/documents/stats');
  return data.data;
};

export const fetchAnalytics = async (): Promise<AnalyticsData> => {
  const { data } = await apiClient.get<{ success: boolean; data: AnalyticsData }>('/ask/analytics');
  return data.data;
};

export const runBenchmark = async (query: string, limit = 10): Promise<BenchmarkResponse> => {
  const { data } = await apiClient.post<BenchmarkResponse>('/benchmark', { query, limit }, { timeout: 30000 });
  return data;
};
