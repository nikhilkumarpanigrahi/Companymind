import { apiClient } from './client';
import type { AddDocumentPayload, DocumentItem, RAGResponse, SearchResponse, SearchResultItem, StatsData } from '../types';

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
