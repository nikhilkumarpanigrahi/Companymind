import { useCallback, useState } from 'react';
import { runBenchmark } from '../api/documents';
import ErrorToast from '../components/ErrorToast';
import type { BenchmarkResponse } from '../types';

/* ─── Preset demo queries ─────────────────────────────── */
const DEMO_QUERIES = [
  { label: 'machine learning', query: 'machine learning algorithms' },
  { label: 'cloud security', query: 'cloud computing security best practices' },
  { label: 'database tuning', query: 'database performance optimization' },
  { label: 'NLP models', query: 'natural language processing techniques' },
  { label: 'API design', query: 'REST API design patterns' },
  { label: 'neural networks', query: 'deep learning neural network architectures' },
];

/* ─── Helper: animated bar ────────────────────────────── */
function MetricBar({
  value,
  max,
  color,
  label,
  suffix = '',
}: {
  value: number;
  max: number;
  color: string;
  label: string;
  suffix?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs text-slate-400 truncate">{label}</span>
      <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-white/[0.04]">
        <div
          className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700 ease-out"
          style={{ width: `${Math.max(pct, 2)}%`, background: color }}
        />
        <span className="absolute inset-0 flex items-center pl-3 text-[11px] font-bold text-white mix-blend-difference">
          {value < 0.1 ? '<0.1' : value.toFixed(1)}{suffix}
        </span>
      </div>
      <span className={`text-[10px] w-16 text-right ${value <= max * 0.3 ? 'text-emerald-400' : value >= max * 0.8 ? 'text-amber-400' : 'text-slate-500'}`}>
        {value <= max * 0.3 ? 'fast' : value >= max * 0.8 ? 'slow' : ''}
      </span>
    </div>
  );
}

/* ─── Improvement badge ───────────────────────────────── */
function ImprovementBadge({ baseline, improved, label }: { baseline: number; improved: number; label: string }) {
  if (baseline <= 0 || improved <= 0) return null;
  const pctChange = ((baseline - improved) / baseline) * 100;
  const isBetter = pctChange > 0;
  return (
    <div className={`rounded-lg border p-4 text-center ${
      isBetter ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
    }`}>
      <p className={`text-2xl font-bold ${isBetter ? 'text-emerald-400' : 'text-red-400'}`}>
        {isBetter ? '↓' : '↑'} {Math.abs(pctChange).toFixed(0)}%
      </p>
      <p className="text-[11px] text-slate-500 mt-1">{label}</p>
    </div>
  );
}

/* ─── Side-by-side result comparison ──────────────────── */
function ResultComparison({
  traditionalResults,
  aiResults,
  traditionalLabel,
  aiLabel,
  traditionalColor,
  aiColor,
}: {
  traditionalResults: { title: string; score: number }[];
  aiResults: { title: string; score: number }[];
  traditionalLabel: string;
  aiLabel: string;
  traditionalColor: string;
  aiColor: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Traditional */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: traditionalColor }} />
          {traditionalLabel}
          <span className="text-[10px] text-slate-600">({traditionalResults.length} results)</span>
        </h4>
        <div className="space-y-1.5">
          {traditionalResults.slice(0, 5).map((r, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md bg-white/[0.02] border border-white/[0.04] px-3 py-2">
              <span className="text-[10px] font-bold text-slate-600 w-4">#{i + 1}</span>
              <span className="text-xs text-slate-300 flex-1 truncate">{r.title}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: traditionalColor + '20', color: traditionalColor }}>
                {r.score.toFixed(4)}
              </span>
            </div>
          ))}
          {traditionalResults.length === 0 && (
            <p className="text-xs text-slate-600 italic py-2">No results found</p>
          )}
        </div>
      </div>
      {/* AI / Semantic */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: aiColor }} />
          {aiLabel}
          <span className="text-[10px] text-slate-600">({aiResults.length} results)</span>
        </h4>
        <div className="space-y-1.5">
          {aiResults.slice(0, 5).map((r, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md bg-white/[0.02] border border-white/[0.04] px-3 py-2">
              <span className="text-[10px] font-bold text-slate-600 w-4">#{i + 1}</span>
              <span className="text-xs text-slate-300 flex-1 truncate">{r.title}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: aiColor + '20', color: aiColor }}>
                {r.score.toFixed(4)}
              </span>
            </div>
          ))}
          {aiResults.length === 0 && (
            <p className="text-xs text-slate-600 italic py-2">No results found</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main: ComparisonPage ────────────────────────────── */
export default function ComparisonPage() {
  const [query, setQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [data, setData] = useState<BenchmarkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = useCallback(async (q?: string) => {
    const trimmed = (q || query).trim();
    if (!trimmed || isRunning) return;
    setQuery(trimmed);
    setIsRunning(true);
    setError(null);
    try {
      const result = await runBenchmark(trimmed, 10);
      setData(result);
    } catch {
      setError('Comparison failed. Make sure the backend & embedding service are running.');
    } finally {
      setIsRunning(false);
    }
  }, [query, isRunning]);

  const summary = data?.summary;
  const methods = data?.methods;

  // Derive comparison metrics
  const regex = summary?.methods.find((m) => m.key === 'regex');
  const text = summary?.methods.find((m) => m.key === 'text');
  const hybrid = summary?.methods.find((m) => m.key === 'hybrid');

  // "Traditional" = best of regex + text; "AI" = hybrid
  const traditionalScore = Math.max(regex?.avgScore ?? 0, text?.avgScore ?? 0);
  const traditionalResults = Math.max(regex?.resultCount ?? 0, text?.resultCount ?? 0);

  const aiScore = hybrid?.avgScore ?? 0;
  const aiResults = hybrid?.resultCount ?? 0;

  return (
    <section className="animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <svg className="h-4 w-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Search Comparison
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          See how CompanyMind's AI-powered semantic search compares to traditional keyword search.
          Run a query to see real performance differences in speed, relevance, and result quality.
        </p>
      </div>

      {/* How it works summary */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-amber-500/10 bg-amber-500/[0.03] p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔤</span>
            <h3 className="text-sm font-bold text-amber-400">Traditional Search</h3>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1 w-1 rounded-full bg-amber-500/50 shrink-0" />
              <span><strong className="text-slate-300">Regex ($regex)</strong> — brute-force O(n) scan of every document</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1 w-1 rounded-full bg-amber-500/50 shrink-0" />
              <span><strong className="text-slate-300">Text Index ($text)</strong> — keyword matching with stemming</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1 w-1 rounded-full bg-amber-500/50 shrink-0" />
              Matches exact words only — misses synonyms & concepts
            </li>
          </ul>
        </div>
        <div className="rounded-lg border border-indigo-500/10 bg-indigo-500/[0.03] p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🧠</span>
            <h3 className="text-sm font-bold text-indigo-400">CompanyMind AI Search</h3>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1 w-1 rounded-full bg-indigo-500/50 shrink-0" />
              <span><strong className="text-slate-300">Vector ($vectorSearch)</strong> — 384-dim embedding cosine similarity</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1 w-1 rounded-full bg-indigo-500/50 shrink-0" />
              <span><strong className="text-slate-300">Hybrid re-ranking</strong> — semantic + keyword boost</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1 w-1 rounded-full bg-indigo-500/50 shrink-0" />
              Understands meaning, context, and synonyms
            </li>
          </ul>
        </div>
      </div>

      {/* Query input */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRun()}
          placeholder="Enter a query to compare search methods..."
          className="flex-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors focus:border-indigo-500/30"
        />
        <button
          onClick={() => handleRun()}
          disabled={isRunning || !query.trim()}
          className="shrink-0 rounded-md bg-indigo-500/20 border border-indigo-500/30 px-6 py-3 text-sm font-medium text-indigo-300 transition-all hover:bg-indigo-500/30 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
              Comparing...
            </span>
          ) : (
            '⚡ Compare'
          )}
        </button>
      </div>

      {/* Demo queries */}
      <div className="mb-8 flex flex-wrap gap-2">
        <span className="text-[10px] text-slate-600 self-center mr-1">Try:</span>
        {DEMO_QUERIES.map((dq) => (
          <button
            key={dq.query}
            onClick={() => { setQuery(dq.query); handleRun(dq.query); }}
            disabled={isRunning}
            className="rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-400 transition-all hover:bg-indigo-500/10 hover:text-indigo-300 hover:border-indigo-500/20 disabled:opacity-50"
          >
            {dq.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isRunning && (
        <div className="flex flex-col items-center gap-4 py-16 animate-fadeIn">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-2 border-indigo-500/20 animate-ping absolute inset-0" />
            <div className="h-16 w-16 rounded-full border-2 border-indigo-500/40 flex items-center justify-center">
              <svg className="h-7 w-7 text-indigo-400 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-300">Running 4 search strategies...</p>
            <p className="text-[11px] text-slate-600 mt-1">Regex → Text Index → Embedding → Vector → Hybrid</p>
          </div>
        </div>
      )}

      {/* ─── RESULTS ─────────────────────────────────────── */}
      {summary && methods && !isRunning && (
        <div className="space-y-8 animate-fadeIn">

          {/* ── Hero: Performance Improvement Summary ──── */}
          <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.05] to-transparent p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">⚡</span>
              <h2 className="text-sm font-bold text-white">Performance Improvement</h2>
            </div>
            <p className="text-[11px] text-slate-500 mb-5">
              CompanyMind Hybrid AI Search vs Traditional Best (Regex / Text Index) for "<span className="text-slate-300">{summary.query}</span>"
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <ImprovementBadge
                baseline={traditionalScore}
                improved={-aiScore}
                label="Relevance Score"
              />
              <div className={`rounded-lg border p-4 text-center ${
                aiScore > traditionalScore ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-slate-700/20 bg-white/[0.02]'
              }`}>
                <p className={`text-2xl font-bold ${aiScore > traditionalScore ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {aiScore > 0 && traditionalScore > 0
                    ? `${((aiScore / traditionalScore) * 100 - 100).toFixed(0)}%`
                    : 'N/A'
                  }
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {aiScore > traditionalScore ? '↑ Better Relevance' : 'Relevance Change'}
                </p>
              </div>
              <div className={`rounded-lg border p-4 text-center ${
                aiResults >= traditionalResults ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'
              }`}>
                <p className="text-2xl font-bold text-indigo-400">
                  {aiResults} <span className="text-sm text-slate-500">vs</span> {traditionalResults}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">AI vs Traditional Results</p>
              </div>
            </div>
          </div>

          {/* ── Latency comparison bars ────────────────── */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" strokeLinecap="round" />
              </svg>
              Speed Comparison
            </h2>
            <p className="text-[11px] text-slate-500 mb-5">Lower is faster. Embedding generation: {summary.totalEmbeddingMs.toFixed(1)}ms (one-time cost)</p>

            <div className="space-y-3">
              {summary.methods.map((m) => {
                const maxLat = Math.max(...summary.methods.map((x) => x.latencyMs), 1);
                const colors: Record<string, string> = {
                  regex: '#f59e0b',
                  text: '#3b82f6',
                  vector: '#10b981',
                  hybrid: '#8b5cf6',
                };
                const labels: Record<string, string> = {
                  regex: '🔤 Regex',
                  text: '📝 Text Index',
                  vector: '🧠 Vector',
                  hybrid: '⚡ Hybrid AI',
                };
                return (
                  <MetricBar
                    key={m.key}
                    value={m.latencyMs}
                    max={maxLat}
                    color={colors[m.key] || '#6366f1'}
                    label={labels[m.key] || m.method}
                    suffix="ms"
                  />
                );
              })}
            </div>

            {/* Speed summary */}
            {regex && hybrid && (
              <div className="mt-5 flex items-center gap-3 rounded-md bg-white/[0.03] border border-white/[0.05] px-4 py-3">
                <span className="text-emerald-400 text-sm">✓</span>
                <p className="text-xs text-slate-400">
                  {hybrid.latencyMs < (regex.latencyMs || 1) && hybrid.latencyMs > 0.1
                    ? <>Hybrid AI Search is <strong className="text-emerald-400">{(regex.latencyMs / hybrid.latencyMs).toFixed(1)}x faster</strong> than Regex while delivering <strong className="text-indigo-400">semantic understanding</strong>.</>
                    : hybrid.latencyMs < 0.1
                      ? <>Hybrid AI Search completed in <strong className="text-emerald-400">&lt;0.1ms</strong> (cached/instant) vs Regex at <strong className="text-amber-400">{regex.latencyMs.toFixed(1)}ms</strong>. Vector search leverages HNSW indexing for near-instant lookups.</>
                      : <>Hybrid AI Search adds only <strong className="text-indigo-400">{(hybrid.latencyMs - regex.latencyMs).toFixed(0)}ms</strong> overhead for significantly better relevance and semantic understanding.</>
                  }
                </p>
              </div>
            )}
          </div>

          {/* ── Relevance Score Comparison ─────────────── */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Relevance Quality
            </h2>
            <p className="text-[11px] text-slate-500 mb-5">Average relevance score per method — higher means more relevant results</p>

            <div className="grid gap-3 sm:grid-cols-4">
              {summary.methods.map((m) => {
                const colors: Record<string, string> = { regex: '#f59e0b', text: '#3b82f6', vector: '#10b981', hybrid: '#8b5cf6' };
                const icons: Record<string, string> = { regex: '🔤', text: '📝', vector: '🧠', hybrid: '⚡' };
                const isWinner = m.avgScore >= Math.max(...summary.methods.map((x) => x.avgScore));
                return (
                  <div key={m.key} className={`rounded-lg border p-4 text-center transition-all ${
                    isWinner ? 'border-emerald-500/30 bg-emerald-500/5 ring-1 ring-emerald-500/20' : 'border-white/[0.06] bg-white/[0.02]'
                  }`}>
                    {isWinner && <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Best</span>}
                    <span className="block text-2xl mt-1">{icons[m.key]}</span>
                    <p className="text-xl font-bold mt-2" style={{ color: colors[m.key] }}>{m.avgScore.toFixed(4)}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{m.method.split('(')[0].trim()}</p>
                    <p className="text-[10px] text-slate-600">{m.resultCount} results</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Side-by-side: Traditional vs AI Results ── */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="text-sm font-bold text-white mb-1">Top Results: Traditional vs AI</h2>
            <p className="text-[11px] text-slate-500 mb-5">
              Compare what each approach returns for the same query. Notice how AI finds conceptually relevant documents that keyword search misses.
            </p>

            {/* Regex vs Hybrid */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Regex vs Hybrid AI</h3>
              <ResultComparison
                traditionalResults={methods.regex?.results || []}
                aiResults={methods.hybrid?.results || []}
                traditionalLabel="Regex ($regex)"
                aiLabel="Hybrid AI (Vector + Boost)"
                traditionalColor="#f59e0b"
                aiColor="#8b5cf6"
              />
            </div>

            {/* Text vs Vector */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Text Index vs Vector Search</h3>
              <ResultComparison
                traditionalResults={methods.text?.results || []}
                aiResults={methods.vector?.results || []}
                traditionalLabel="Text Index ($text)"
                aiLabel="Vector Search ($vectorSearch)"
                traditionalColor="#3b82f6"
                aiColor="#10b981"
              />
            </div>
          </div>

          {/* ── What changed: How we improved ─────────── */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] border-l-2 border-l-indigo-500/40 p-6">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              🚀 How CompanyMind Improves Search
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider">❌ Traditional Problems</h3>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-red-500">✗</span>
                    Only matches exact keywords — "ML" won't find "machine learning"
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-red-500">✗</span>
                    Regex scans every document (O(n)) — gets slower as data grows
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-red-500">✗</span>
                    No understanding of context, synonyms, or meaning
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-red-500">✗</span>
                    Relevance scoring based on term frequency alone
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">✅ CompanyMind Solutions</h3>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-emerald-500">✓</span>
                    384-dim embeddings capture <strong className="text-slate-300">semantic meaning</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-emerald-500">✓</span>
                    HNSW index for O(log n) approximate nearest neighbor search
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-emerald-500">✓</span>
                    Understands synonyms, context, and conceptual similarity
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-emerald-500">✓</span>
                    Hybrid re-ranking combines semantic + keyword for best of both
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── Tech stack badge row ──────────────────── */}
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {[
              { label: 'MongoDB Atlas Vector Search', color: 'emerald' },
              { label: 'all-MiniLM-L6-v2 Embeddings', color: 'indigo' },
              { label: 'HNSW Cosine Similarity', color: 'violet' },
              { label: 'Hybrid Re-ranking', color: 'purple' },
              { label: 'Groq LLM (RAG)', color: 'pink' },
            ].map((tech) => (
              <span
                key={tech.label}
                className={`rounded-full border border-${tech.color}-500/20 bg-${tech.color}-500/5 px-3 py-1 text-[10px] font-medium text-${tech.color}-400`}
              >
                {tech.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─── Empty state ─────────────────────────────── */}
      {!data && !isRunning && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-12 text-center animate-fadeIn">
          <div className="flex justify-center gap-6 mb-6">
            <div className="flex flex-col items-center gap-2">
              <div className="h-14 w-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl">🔤</div>
              <span className="text-[10px] text-slate-600">Traditional</span>
            </div>
            <div className="self-center text-slate-600 text-2xl font-light">vs</div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-14 w-14 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl">🧠</div>
              <span className="text-[10px] text-slate-600">AI Search</span>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            Enter a query above to see how <strong className="text-indigo-400">AI-powered search</strong> outperforms traditional keyword search.
          </p>
          <p className="mt-2 text-[11px] text-slate-600">
            We'll run Regex, Text Index, Vector Search, and Hybrid search — then show you the difference.
          </p>
        </div>
      )}

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </section>
  );
}
