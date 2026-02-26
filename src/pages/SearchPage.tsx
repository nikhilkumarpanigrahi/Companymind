import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { askQuestionStream, fetchStats, searchDocuments } from '../api/documents';
import AIAnswer from '../components/AIAnswer';
import ErrorToast from '../components/ErrorToast';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import ResponseMeta from '../components/ResponseMeta';
import ResultCard from '../components/ResultCard';
import SearchBar from '../components/SearchBar';
import SearchPipelineAnimation from '../components/SearchPipelineAnimation';
import { useDebounce } from '../hooks/useDebounce';
import type { ConversationMessage, RAGResponse, RAGSource, SearchResultItem } from '../types';

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
  const [docCount, setDocCount] = useState<number | null>(null);

  useEffect(() => {
    fetchStats().then(s => setDocCount(s.totalDocuments)).catch(() => {});
  }, []);
  const [ragResponse, setRagResponse] = useState<RAGResponse | null>(null);
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [streamingSources, setStreamingSources] = useState<RAGSource[]>([]);
  const streamingSourcesRef = useRef<RAGSource[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAskLoading, setIsAskLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);

  // Conversation memory
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [pastExchanges, setPastExchanges] = useState<{ question: string; response: RAGResponse }[]>([]);

  const abortRef = useRef<(() => void) | null>(null);
  const debouncedQuery = useDebounce(query, 450);

  // Cleanup active stream on unmount
  useEffect(() => {
    return () => { abortRef.current?.(); };
  }, []);

  useEffect(() => { setPage(1); }, [debouncedQuery]);

  // Semantic search effect
  useEffect(() => {
    if (mode !== 'search') return;
    const trimmedQuery = debouncedQuery.trim();
    if (!trimmedQuery) {
      setResults([]); setTotal(0); setResponseTimeMs(null); setIsLoading(false);
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

  // Ask AI handler — with streaming + conversation history
  const handleAsk = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed || isAskLoading || isStreaming) return;

    // Cancel previous stream
    if (abortRef.current) abortRef.current();

    setIsAskLoading(true);
    setIsStreaming(true);
    setStreamingAnswer('');
    setStreamingSources([]);
    setRagResponse(null);
    setError(null);

    const cancel = askQuestionStream(trimmed, conversationHistory, {
      onToken: (token) => {
        setStreamingAnswer((prev) => prev + token);
      },
      onSources: (sources) => {
        setStreamingSources(sources);
        streamingSourcesRef.current = sources;
        setIsAskLoading(false); // stop shimmer, show streaming text
      },
      onDone: (meta, fullAnswer) => {
        const finalResponse: RAGResponse = {
          success: true,
          answer: fullAnswer,
          sources: streamingSourcesRef.current.length > 0 ? streamingSourcesRef.current : [],
          meta,
        };
        setRagResponse(finalResponse);
        setStreamingAnswer('');
        setIsStreaming(false);
        setIsAskLoading(false);

        // Update conversation memory
        setConversationHistory((prev) => [
          ...prev,
          { role: 'user', content: trimmed },
          { role: 'assistant', content: fullAnswer },
        ]);
        setPastExchanges((prev) => [...prev, { question: trimmed, response: finalResponse }]);
      },
      onError: (errMsg) => {
        setError(errMsg);
        setIsStreaming(false);
        setIsAskLoading(false);
      },
    });

    abortRef.current = cancel;
  }, [query, isAskLoading, isStreaming, conversationHistory]);

  const handleModeChange = (newMode: 'search' | 'ask') => {
    setMode(newMode);
    setRagResponse(null);
    setStreamingAnswer('');
    setIsStreaming(false);
  };

  const handleExampleClick = (example: string) => { setQuery(example); };

  const handleClearConversation = () => {
    setConversationHistory([]);
    setPastExchanges([]);
    setRagResponse(null);
    setStreamingAnswer('');
  };

  const isEmpty = useMemo(
    () => mode === 'search' && Boolean(debouncedQuery.trim()) && !isLoading && results.length === 0,
    [mode, debouncedQuery, isLoading, results.length]
  );

  const showHero = !query.trim() && !ragResponse && !isStreaming && pastExchanges.length === 0;

  return (
    <section className="flex min-h-[72vh] flex-col items-center">
      {/* Hero */}
      {showHero && (
        <div className="mt-6 mb-2 text-center sm:mt-10">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            CompanyMind
          </h1>
          <p className="mx-auto max-w-md text-sm text-slate-500">
            Search {docCount ? `${docCount.toLocaleString()}` : ''} documents with semantic understanding or ask AI to generate answers.
          </p>
        </div>
      )}

      {/* Compact header when searching */}
      {!showHero && (
        <div className="mt-3 mb-2 text-center">
          <h1 className="text-lg font-semibold tracking-tight text-white">
            CompanyMind
          </h1>
        </div>
      )}

      {/* Search Bar */}
      <div className="mt-4 w-full">
        <SearchBar
          value={query}
          onChange={setQuery}
          onClear={() => { setQuery(''); setRagResponse(null); setStreamingAnswer(''); }}
          mode={mode}
          onModeChange={handleModeChange}
          onAsk={handleAsk}
          isLoading={isAskLoading}
        />

        {/* Conversation memory indicator */}
        {mode === 'ask' && conversationHistory.length > 0 && (
          <div className="mx-auto mt-2 flex max-w-2xl items-center justify-between rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {Math.floor(conversationHistory.length / 2)} previous exchange{conversationHistory.length > 2 ? 's' : ''} in context
            </span>
            <button
              onClick={handleClearConversation}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Example queries */}
        {showHero && (
          <div className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-600">Try:</span>
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example}
                onClick={() => handleExampleClick(example)}
                className="rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-slate-300"
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

      {/* Pipeline animation — visible during search / ask and after results arrive */}
      {debouncedQuery.trim() && (
        <SearchPipelineAnimation
          mode={mode}
          isActive={mode === 'search' ? isLoading : (isAskLoading || isStreaming)}
          isDone={mode === 'search' ? (!isLoading && results.length > 0) : (!!ragResponse && !isStreaming && !isAskLoading)}
        />
      )}

      {/* Results Area */}
      <div className="mt-5 w-full max-w-3xl">
        {/* Search results */}
        {mode === 'search' && isLoading && <LoadingSpinner message="Searching..." />}

        {mode === 'search' && !isLoading && results.map((item, i) => (
          <div key={item.id || `${item.title}-${item.relevanceScore}`} className="mb-2">
            <ResultCard item={item} index={i} />
          </div>
        ))}

        {isEmpty && (
          <div className="mt-8 rounded-lg border border-white/[0.06] bg-white/[0.02] p-6 text-center">
            <p className="text-sm text-slate-500">
              No results found for <span className="font-medium text-slate-400">"{debouncedQuery}"</span>
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

        {/* Past conversation exchanges */}
        {mode === 'ask' && pastExchanges.map((exchange, i) => (
          <div key={i} className="mb-3 opacity-50">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="rounded-md bg-white/[0.04] px-2.5 py-1 text-xs text-slate-500">{exchange.question}</span>
            </div>
            <AIAnswer data={exchange.response} compact />
          </div>
        ))}

        {/* Ask AI — loading */}
        {mode === 'ask' && isAskLoading && !streamingAnswer && (
          <div className="mt-3">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.06]">
                  <svg className="h-3.5 w-3.5 text-slate-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">Generating answer...</p>
                  <p className="text-[11px] text-slate-600">Retrieving documents and analyzing</p>
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="h-3 w-3/4 rounded bg-white/[0.04] animate-pulse" />
                <div className="h-3 w-full rounded bg-white/[0.04] animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-white/[0.04] animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Streaming answer */}
        {mode === 'ask' && isStreaming && streamingAnswer && (
          <div className="mt-3">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.06]">
                  <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">AI Answer</p>
                  <p className="flex items-center gap-1 text-[11px] text-emerald-500">
                    <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                    Generating...
                  </p>
                </div>
              </div>
              <div className="ai-answer text-sm leading-relaxed text-slate-400 whitespace-pre-wrap">
                {streamingAnswer}
                <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-slate-500 animate-pulse" />
              </div>
            </div>

            {/* Sources while streaming */}
            {streamingSources.length > 0 && (
              <div className="mt-2">
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-600">
                  Sources
                </p>
                <div className="grid gap-1.5 sm:grid-cols-3">
                  {streamingSources.map((s, i) => (
                    <div key={i} className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-slate-500 truncate">
                      <span className="text-slate-400 font-medium">{i+1}.</span> {s.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Final AI answer */}
        {mode === 'ask' && ragResponse && !isStreaming && !isAskLoading && (
          <div className="mt-3">
            <AIAnswer data={ragResponse} />
          </div>
        )}
      </div>

      {/* Tech stack */}
      {showHero && (
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-slate-600">
          <span>MongoDB Atlas Vector Search</span>
          <span className="text-slate-700">|</span>
          <span>MiniLM-L6-v2 Embeddings</span>
          <span className="text-slate-700">|</span>
          <span>Groq + Llama 3</span>
          <span className="text-slate-700">|</span>
          <span>React + Vite</span>
        </div>
      )}

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </section>
  );
}

export default SearchPage;
