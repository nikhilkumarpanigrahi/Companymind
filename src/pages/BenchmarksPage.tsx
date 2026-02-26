import { useCallback, useState } from 'react';
import { runBenchmark } from '../api/documents';
import ErrorToast from '../components/ErrorToast';
import type { BenchmarkMethodResult, BenchmarkResponse, BenchmarkResultItem } from '../types';

const SAMPLE_QUERIES = [
  'machine learning algorithms',
  'cloud computing security',
  'database performance optimization',
  'natural language processing',
  'REST API design patterns',
  'neural network architectures',
];

const METHOD_COLORS: Record<string, string> = {
  regex: '#f59e0b',   // amber
  text: '#3b82f6',    // blue
  vector: '#10b981',  // emerald
  hybrid: '#8b5cf6',  // violet
};

const METHOD_ICONS: Record<string, string> = {
  regex: '🔤',
  text: '📝',
  vector: '🧠',
  hybrid: '⚡',
};

/* ─── Bar component (pure CSS, no chart library) ────────────── */
function Bar({ value, max, color, label, suffix = 'ms' }: {
  value: number; max: number; color: string; label: string; suffix?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-44 shrink-0 text-xs text-slate-400 truncate">{label}</span>
      <div className="relative h-6 flex-1 overflow-hidden rounded-lg bg-white/[0.04]">
        <div
          className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
        <span className="absolute inset-0 flex items-center pl-3 text-[11px] font-semibold text-white mix-blend-difference">
          {value.toFixed(1)}{suffix}
        </span>
      </div>
    </div>
  );
}

/* ─── Score dot chart ───────────────────────────────────── */
function ScoreDots({ results, color }: { results: BenchmarkResultItem[]; color: string }) {
  if (!results.length) return <span className="text-[10px] text-slate-600">No results</span>;
  const maxScore = Math.max(...results.map((r) => r.score), 0.01);
  return (
    <div className="flex items-end gap-[3px] h-10">
      {results.map((r, i) => (
        <div
          key={r.id || i}
          title={`${r.title} — score: ${r.score.toFixed(4)}`}
          className="w-2 rounded-t-sm transition-all duration-500"
          style={{
            height: `${(r.score / maxScore) * 100}%`,
            background: color,
            opacity: 0.6 + (r.score / maxScore) * 0.4,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Overlap heatmap ─────────────────────────────────── */
function OverlapMatrix({ overlap }: {
  overlap: Record<string, Record<string, { count: number; pct: number }>>;
}) {
  const keys = Object.keys(overlap);
  const labels: Record<string, string> = {
    regex: 'Regex',
    text: 'Text',
    vector: 'Vector',
    hybrid: 'Hybrid',
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr>
            <th className="p-2 text-left text-slate-500" />
            {keys.map((k) => (
              <th key={k} className="p-2 text-center text-slate-400 font-semibold">{labels[k] || k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {keys.map((row) => (
            <tr key={row}>
              <td className="p-2 text-slate-400 font-semibold">{labels[row] || row}</td>
              {keys.map((col) => {
                const cell = overlap[row]?.[col];
                const pct = cell?.pct ?? 0;
                const bg =
                  row === col
                    ? 'bg-white/[0.08]'
                    : pct >= 70
                      ? 'bg-emerald-500/20'
                      : pct >= 40
                        ? 'bg-amber-500/15'
                        : pct > 0
                          ? 'bg-white/[0.04]'
                          : '';
                return (
                  <td key={col} className={`p-2 text-center rounded ${bg}`}>
                    <span className="text-slate-300 font-medium">{pct}%</span>
                    <span className="block text-[9px] text-slate-600">{cell?.count ?? 0} docs</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Method detail card ──────────────────────────────── */
function MethodCard({ methodKey, data }: { methodKey: string; data: BenchmarkMethodResult }) {
  const [expanded, setExpanded] = useState(false);
  const color = METHOD_COLORS[methodKey] || '#6366f1';
  const icon = METHOD_ICONS[methodKey] || '🔍';

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.12]">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white">{data.method}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{data.description}</p>
        </div>
        <span
          className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold"
          style={{ background: color + '20', color }}
        >
          {data.latencyMs.toFixed(1)}ms
        </span>
      </div>

      {/* Mongo feature badge */}
      <span className="inline-block rounded-md bg-white/[0.05] border border-white/10 px-2 py-0.5 text-[10px] text-slate-400 mb-3">
        MongoDB: <span className="text-indigo-300 font-medium">{data.mongoFeature}</span>
      </span>

      {/* Score visualization */}
      <div className="mb-3">
        <span className="text-[10px] text-slate-600 uppercase tracking-wider">Relevance Scores ({data.count} results)</span>
        <div className="mt-1">
          <ScoreDots results={data.results} color={color} />
        </div>
      </div>

      {/* Expandable results */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        {expanded ? '▾ Hide results' : '▸ Show results'}
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5 animate-fadeIn">
          {data.results.map((r, i) => (
            <div key={r.id || i} className="flex items-start gap-2 rounded-lg bg-white/[0.02] p-2">
              <span className="text-[10px] font-bold text-slate-600 mt-0.5 w-4 shrink-0">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-300 truncate">{r.title}</p>
                <p className="text-[10px] text-slate-600 truncate">{r.snippet}</p>
              </div>
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
                style={{ background: color + '20', color }}
              >
                {r.score.toFixed(4)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────── */
export default function BenchmarksPage() {
  const [query, setQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [data, setData] = useState<BenchmarkResponse | null>(null);
  const [history, setHistory] = useState<{ query: string; data: BenchmarkResponse }[]>([]);
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
      setHistory((prev) => [{ query: trimmed, data: result }, ...prev].slice(0, 10));
    } catch {
      setError('Benchmark failed. Make sure the embedding service is running.');
    } finally {
      setIsRunning(false);
    }
  }, [query, isRunning]);

  const summary = data?.summary;
  const methods = data?.methods;
  const maxLatency = summary ? Math.max(...summary.methods.map((m) => m.latencyMs), 1) : 1;

  return (
    <section className="animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Search Benchmarks
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Run the same query through 4 different MongoDB search strategies and compare latency, relevance, and result overlap.
        </p>
      </div>

      {/* Query input */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRun()}
            placeholder="Enter a search query to benchmark..."
            className="w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors focus:border-white/[0.16]"
          />
        </div>
        <button
          onClick={() => handleRun()}
          disabled={isRunning || !query.trim()}
          className="shrink-0 rounded-md bg-white/[0.1] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.15] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Running...
            </span>
          ) : (
            '🚀 Run Benchmark'
          )}
        </button>
      </div>

      {/* Sample queries */}
      <div className="mb-8 flex flex-wrap gap-2">
        <span className="text-[10px] text-slate-600 self-center">Try:</span>
        {SAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => { setQuery(q); handleRun(q); }}
            className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-400 transition-all hover:bg-white/[0.08] hover:text-slate-200 hover:border-white/10"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Pipeline visualization */}
      {isRunning && (
        <div className="mb-8 flex flex-col items-center gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            {['Regex Scan', 'Text Index', 'Embedding', 'Vector Search', 'Hybrid Re-rank'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.04] text-sm animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                >
                  <span>{['🔤', '📝', '🧠', '🎯', '⚡'][i]}</span>
                </div>
                {i < 4 && <div className="hidden sm:block h-px w-6 bg-white/[0.08]" />}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 animate-pulse">Running 4 search strategies in parallel...</p>
        </div>
      )}

      {/* Results */}
      {summary && methods && !isRunning && (
        <div className="space-y-8 animate-fadeIn">
          {/* Latency comparison */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="mb-1 text-sm font-medium text-white flex items-center gap-2">
              Latency Comparison
            </h2>
            <p className="text-[11px] text-slate-500 mb-4">
              Query: "<span className="text-slate-300">{summary.query}</span>" — Embedding generation: {summary.totalEmbeddingMs.toFixed(1)}ms
            </p>
            <div className="space-y-3">
              {summary.methods.map((m) => (
                <Bar
                  key={m.key}
                  value={m.latencyMs}
                  max={maxLatency}
                  color={METHOD_COLORS[m.key] || '#6366f1'}
                  label={`${METHOD_ICONS[m.key] || ''} ${m.method}`}
                />
              ))}
            </div>
          </div>

          {/* Score + count summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summary.methods.map((m) => {
              const color = METHOD_COLORS[m.key] || '#6366f1';
              return (
                <div key={m.key} className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                  <span className="text-2xl">{METHOD_ICONS[m.key]}</span>
                  <p className="mt-1 text-xs font-medium text-slate-300">{m.method.split('(')[0].trim()}</p>
                  <div className="mt-3 flex justify-center gap-4">
                    <div>
                      <p className="text-lg font-semibold" style={{ color }}>{m.latencyMs.toFixed(0)}<span className="text-xs text-slate-500">ms</span></p>
                      <p className="text-[9px] text-slate-600">Latency</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-300">{m.resultCount}</p>
                      <p className="text-[9px] text-slate-600">Results</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-300">{m.avgScore.toFixed(3)}</p>
                      <p className="text-[9px] text-slate-600">Avg Score</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Result overlap heatmap */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="mb-1 text-sm font-medium text-white flex items-center gap-2">
              Result Overlap Matrix
            </h2>
            <p className="text-[11px] text-slate-500 mb-4">
              Shows what percentage of results from each method also appear in the other.
              Low overlap between regex/text and vector proves semantic search finds conceptually similar documents that keyword matching misses.
            </p>
            <OverlapMatrix overlap={summary.overlap} />
          </div>

          {/* Detailed method cards */}
          <div>
            <h2 className="mb-4 text-sm font-medium text-white">
              Detailed Results by Method
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {Object.entries(methods).map(([key, methodData]) => (
                <MethodCard key={key} methodKey={key} data={methodData} />
              ))}
            </div>
          </div>

          {/* Key insights */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] border-l-emerald-500/40 border-l-2 p-6">
            <h2 className="mb-3 text-sm font-medium text-white">
              Key Insights
            </h2>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                <span><strong className="text-slate-300">Regex ($regex)</strong> does a brute-force O(n) scan — slowest and no semantic understanding. Useful only for exact-match lookups.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                <span><strong className="text-slate-300">Text Index ($text)</strong> uses MongoDB's built-in inverted index with stemming — fast for keyword matching but misses conceptual similarity.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span><strong className="text-slate-300">Vector Search ($vectorSearch)</strong> converts queries to 384-dim embeddings and uses HNSW cosine similarity — captures <em>meaning</em>, not just words. This is MongoDB Atlas's killer feature for AI applications.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                <span><strong className="text-slate-300">Hybrid (Vector + Keyword)</strong> combines the best of both — semantic understanding with keyword boosting. The re-ranking ensures exact matches are promoted while keeping conceptual results.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-bold text-white">Benchmark History</h2>
          <div className="space-y-2">
            {history.slice(1).map((h, i) => (
              <button
                key={i}
                onClick={() => { setData(h.data); setQuery(h.query); }}
                className="w-full rounded-lg bg-white/[0.02] border border-white/5 p-3 text-left transition-all hover:bg-white/[0.05]"
              >
                <span className="text-xs font-medium text-slate-300">"{h.query}"</span>
                <span className="ml-3 text-[10px] text-slate-600">
                  {h.data.summary.methods.map((m) => `${m.method.split('(')[0].trim()}: ${m.latencyMs.toFixed(0)}ms`).join(' · ')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!data && !isRunning && (
        <div className="mt-12 rounded-lg border border-white/[0.06] bg-white/[0.02] p-10 text-center animate-fadeIn">
          <span className="text-4xl">🏁</span>
          <p className="mt-3 text-sm text-slate-400">Enter a query above and hit <strong className="text-slate-300">Run Benchmark</strong> to compare all 4 MongoDB search strategies head-to-head.</p>
          <p className="mt-1 text-[11px] text-slate-600">Each benchmark runs Regex, Text, Vector, and Hybrid search — then shows latency, scoring, and overlap analysis.</p>
        </div>
      )}

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </section>
  );
}
