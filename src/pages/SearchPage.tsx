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
            Search {docCount ? `${docCount.toLocaleString()}+` : ''} documents with semantic understanding, or ask AI to synthesize answers from your knowledge base.
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
          onClear={() => { setQuery(''); setRagResponse(null); setStreamingAnswer(''); }}
          mode={mode}
          onModeChange={handleModeChange}
          onAsk={handleAsk}
          isLoading={isAskLoading}
        />

        {/* Conversation memory indicator */}
        {mode === 'ask' && conversationHistory.length > 0 && (
          <div className="mx-auto mt-3 flex max-w-2xl items-center justify-between rounded-lg border border-purple-500/20 bg-purple-500/5 px-4 py-2">
            <span className="flex items-center gap-2 text-xs text-purple-300">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {Math.floor(conversationHistory.length / 2)} previous exchange{conversationHistory.length > 2 ? 's' : ''} in memory — AI can follow up
            </span>
            <button
              onClick={handleClearConversation}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear history
            </button>
          </div>
        )}

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

      {/* Pipeline animation — visible during search / ask and after results arrive */}
      {debouncedQuery.trim() && (
        <SearchPipelineAnimation
          mode={mode}
          isActive={mode === 'search' ? isLoading : (isAskLoading || isStreaming)}
          isDone={mode === 'search' ? (!isLoading && results.length > 0) : (!!ragResponse && !isStreaming && !isAskLoading)}
        />
      )}

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

        {/* Past conversation exchanges */}
        {mode === 'ask' && pastExchanges.map((exchange, i) => (
          <div key={i} className="mb-4 opacity-60">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-400">{exchange.question}</span>
            </div>
            <AIAnswer data={exchange.response} compact />
          </div>
        ))}

        {/* Ask AI — streaming shimmer */}
        {mode === 'ask' && isAskLoading && !streamingAnswer && (
          <div className="mt-4">
            <div className="glass rounded-2xl p-6 pulse-glow">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 animate-pulse">
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a8 8 0 0 1 8 8c0 3.5-2 5.5-4 7l-1 4H9l-1-4c-2-1.5-4-3.5-4-7a8 8 0 0 1 8-8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">CompanyMind AI</h3>
                  <p className="text-xs text-slate-500">Analyzing documents & generating response...</p>
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

        {/* Streaming answer (live tokens) */}
        {mode === 'ask' && isStreaming && streamingAnswer && (
          <div className="mt-4">
            <div className="glass rounded-2xl p-6 shadow-glow">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500">
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a8 8 0 0 1 8 8c0 3.5-2 5.5-4 7l-1 4H9l-1-4c-2-1.5-4-3.5-4-7a8 8 0 0 1 8-8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">CompanyMind AI</h3>
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Generating response...
                  </p>
                </div>
              </div>
              <div className="ai-answer text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                {streamingAnswer}
                <span className="inline-block w-2 h-4 ml-0.5 bg-indigo-400 animate-pulse" />
              </div>
            </div>

            {/* Show sources while streaming */}
            {streamingSources.length > 0 && (
              <div className="mt-3">
                <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  Sources
                </h4>
                <div className="grid gap-2 sm:grid-cols-3">
                  {streamingSources.map((s, i) => (
                    <div key={i} className="glass-light rounded-xl p-2 text-[11px] text-slate-400 truncate">
                      <span className="text-indigo-300 font-medium">{i+1}.</span> {s.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Final AI answer */}
        {mode === 'ask' && ragResponse && !isStreaming && !isAskLoading && (
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
