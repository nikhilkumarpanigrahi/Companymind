import { useCallback, useEffect, useMemo, useState } from 'react';
import { askQuestion, searchDocuments } from '../api/documents';
import AIAnswer from '../components/AIAnswer';
import ErrorToast from '../components/ErrorToast';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import ResponseMeta from '../components/ResponseMeta';
import ResultCard from '../components/ResultCard';
import SearchBar from '../components/SearchBar';
import { useDebounce } from '../hooks/useDebounce';
import type { RAGResponse, SearchResultItem } from '../types';

const DEFAULT_PAGE_SIZE = Number(import.meta.env.VITE_DEFAULT_PAGE_SIZE || 10);

const EXAMPLE_QUERIES = [
  'How do vector databases work?',
  'Machine learning for beginners',
  'Building REST APIs with Node.js',
  'Database performance optimization',
  'What is semantic search?',
  'Cloud deployment strategies',
];

function SearchPage() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'search' | 'ask'>('search');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [ragResponse, setRagResponse] = useState<RAGResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAskLoading, setIsAskLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);

  const debouncedQuery = useDebounce(query, 450);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  // Semantic search effect
  useEffect(() => {
    if (mode !== 'search') return;

    const trimmedQuery = debouncedQuery.trim();
    if (!trimmedQuery) {
      setResults([]);
      setTotal(0);
      setResponseTimeMs(null);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    const runSearch = async () => {
      setIsLoading(true);
      const start = performance.now();

      try {
        const response = await searchDocuments(trimmedQuery, page, DEFAULT_PAGE_SIZE);
        if (isCancelled) return;

        setResults(response.results);
        setTotal(response.total);
        setResponseTimeMs(response.tookMs ?? performance.now() - start);
      } catch {
        if (isCancelled) return;
        setError('Search failed. Please check API connection and try again.');
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    void runSearch();
    return () => { isCancelled = true; };
  }, [debouncedQuery, page, mode]);

  // Ask AI handler
  const handleAsk = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || isAskLoading) return;

    setIsAskLoading(true);
    setRagResponse(null);
    setError(null);

    try {
      const response = await askQuestion(trimmed);
      setRagResponse(response);
    } catch {
      setError('AI failed to answer. Make sure GROQ_API_KEY is set in your .env file.');
    } finally {
      setIsAskLoading(false);
    }
  }, [query, isAskLoading]);

  const handleModeChange = (newMode: 'search' | 'ask') => {
    setMode(newMode);
    setRagResponse(null);
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  const isEmpty = useMemo(
    () => mode === 'search' && Boolean(debouncedQuery.trim()) && !isLoading && results.length === 0,
    [mode, debouncedQuery, isLoading, results.length]
  );

  const showHero = !query.trim() && !ragResponse;

  return (
    <section className="flex min-h-[72vh] flex-col items-center">
      {/* Hero */}
      {showHero && (
        <div className="mt-8 mb-2 text-center animate-fadeIn sm:mt-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Powered by MongoDB Atlas Vector Search + RAG
          </div>
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Your AI Knowledge
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"> Engine</span>
          </h1>
          <p className="mx-auto max-w-lg text-base text-slate-400">
            Search 173+ documents with semantic understanding, or ask AI to synthesize answers from your knowledge base.
          </p>
        </div>
      )}

      {/* Compact header when searching */}
      {!showHero && (
        <div className="mt-4 mb-2 text-center animate-fadeIn">
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Company<span className="text-indigo-400">Mind</span>
          </h1>
        </div>
      )}

      {/* Search Bar */}
      <div className="mt-4 w-full">
        <SearchBar
          value={query}
          onChange={setQuery}
          onClear={() => { setQuery(''); setRagResponse(null); }}
          mode={mode}
          onModeChange={handleModeChange}
          onAsk={handleAsk}
          isLoading={isAskLoading}
        />

        {/* Example queries */}
        {showHero && (
          <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-2 animate-fadeIn">
            <span className="text-xs text-slate-600">Try:</span>
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example}
                onClick={() => handleExampleClick(example)}
                className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 transition-all hover:bg-white/[0.08] hover:text-slate-200 hover:border-white/10"
              >
                {example}
              </button>
            ))}
          </div>
        )}

        {/* Search mode meta */}
        {mode === 'search' && (
          <ResponseMeta tookMs={responseTimeMs} total={total} query={debouncedQuery} />
        )}
      </div>

      {/* Results Area */}
      <div className="mt-6 w-full max-w-3xl">
        {/* Search results */}
        {mode === 'search' && isLoading && <LoadingSpinner message="Searching vectors..." />}

        {mode === 'search' && !isLoading && results.map((item, i) => (
          <div key={item.id || `${item.title}-${item.relevanceScore}`} className="mb-3">
            <ResultCard item={item} index={i} />
          </div>
        ))}

        {isEmpty && (
          <div className="mt-10 rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center animate-fadeIn">
            <p className="text-slate-500">
              No results found for <span className="font-semibold text-slate-400">"{debouncedQuery}"</span>
            </p>
          </div>
        )}

        {mode === 'search' && !isLoading && results.length > 0 && (
          <Pagination
            page={page}
            pageSize={DEFAULT_PAGE_SIZE}
            total={total}
            onPageChange={(nextPage) => setPage(nextPage)}
          />
        )}

        {/* Ask AI results */}
        {mode === 'ask' && isAskLoading && (
          <div className="mt-8">
            <div className="glass rounded-2xl p-6 pulse-glow">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 animate-pulse">
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a8 8 0 0 1 8 8c0 3.5-2 5.5-4 7l-1 4H9l-1-4c-2-1.5-4-3.5-4-7a8 8 0 0 1 8-8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">CompanyMind AI</h3>
                  <p className="text-xs text-slate-500">Analyzing documents...</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 w-3/4 rounded bg-white/5 animate-shimmer bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%]" />
                <div className="h-4 w-full rounded bg-white/5 animate-shimmer bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%]" />
                <div className="h-4 w-2/3 rounded bg-white/5 animate-shimmer bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%]" />
              </div>
            </div>
          </div>
        )}

        {mode === 'ask' && ragResponse && !isAskLoading && (
          <div className="mt-4">
            <AIAnswer data={ragResponse} />
          </div>
        )}
      </div>

      {/* Tech Stack Badge */}
      {showHero && (
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 animate-fadeIn" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          {[
            { icon: '🍃', label: 'MongoDB Atlas', desc: 'Vector Search' },
            { icon: '🧠', label: 'MiniLM-L6-v2', desc: '384-dim embeddings' },
            { icon: '⚡', label: 'Groq + Llama 3', desc: 'RAG Generation' },
            { icon: '⚛️', label: 'React + Vite', desc: 'Frontend' },
          ].map((tech) => (
            <div key={tech.label} className="glass-light rounded-xl p-4 text-center transition-all hover:bg-white/[0.06]">
              <div className="mb-1 text-xl">{tech.icon}</div>
              <p className="text-xs font-semibold text-slate-300">{tech.label}</p>
              <p className="text-[10px] text-slate-500">{tech.desc}</p>
            </div>
          ))}
        </div>
      )}

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </section>
  );
}

export default SearchPage;
