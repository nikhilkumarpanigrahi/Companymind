import { useEffect, useState } from 'react';
import { fetchStats, fetchAnalytics } from '../api/documents';
import ErrorToast from '../components/ErrorToast';
import type { StatsData, AnalyticsData } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  database: 'bg-blue-500',
  'software engineering': 'bg-indigo-500',
  'AI research': 'bg-purple-500',
  technology: 'bg-cyan-500',
  devops: 'bg-orange-500',
  backend: 'bg-emerald-500',
  frontend: 'bg-pink-500',
  NLP: 'bg-violet-500',
  'data science': 'bg-amber-500',
  security: 'bg-red-500',
};

function getColor(cat: string) {
  return CATEGORY_COLORS[cat] || 'bg-slate-500';
}

function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchStats().catch(() => { setError('Failed to load stats'); return null; }),
      fetchAnalytics().catch(() => null),
    ])
      .then(([s, a]) => { setStats(s); setAnalytics(a); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="animate-fadeIn">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Loading knowledge base analytics...</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5 h-28 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!stats) return null;

  const topCategories = stats.categories.slice(0, 10);
  const maxCatCount = Math.max(...topCategories.map(c => c.count), 1);

  return (
    <section className="animate-fadeIn space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Knowledge base analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:bg-white/[0.04]">
          <p className="text-xs text-slate-500 mb-2">Total Documents</p>
          <p className="text-2xl font-semibold text-white">{stats.totalDocuments}</p>
        </div>

        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:bg-white/[0.04]">
          <p className="text-xs text-slate-500 mb-2">Categories</p>
          <p className="text-2xl font-semibold text-white">{stats.categories.length}</p>
        </div>

        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:bg-white/[0.04]">
          <p className="text-xs text-slate-500 mb-2">Unique Tags</p>
          <p className="text-2xl font-semibold text-white">{stats.topTags.length}+</p>
        </div>

        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:bg-white/[0.04]">
          <p className="text-xs text-slate-500 mb-2">Vector Dimensions</p>
          <p className="text-2xl font-semibold text-white">384</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Categories Breakdown */}
        <div className="lg:col-span-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-500">
            Categories Distribution
          </h2>
          <div className="space-y-3">
            {topCategories.map((cat) => (
              <div key={cat.name} className="group">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300 capitalize">{cat.name}</span>
                  <span className="text-xs font-mono text-slate-500">{cat.count} docs</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getColor(cat.name)} transition-all duration-500`}
                    style={{ width: `${(cat.count / maxCatCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {stats.categories.length > 10 && (
            <p className="mt-4 text-xs text-slate-600">+{stats.categories.length - 10} more categories</p>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Documents */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-500">
              Recent Documents
            </h2>
            <div className="space-y-2">
              {stats.recentDocuments.map((doc) => (
                <div key={doc._id} className="flex items-start gap-3 rounded-md border border-white/[0.04] bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/60" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-300">{doc.title}</p>
                    <p className="text-[10px] text-slate-600 capitalize">{doc.category || 'uncategorized'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Tags */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-500">
              Top Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {stats.topTags.map((tag) => (
                <span
                  key={tag.name}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-400 hover:bg-white/[0.06] transition-all"
                >
                  {tag.name}
                  <span className="text-[10px] text-slate-600">{tag.count}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Usage Analytics */}
      {analytics && analytics.totalQueries > 0 && (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Analytics KPIs + Popular Queries */}
          <div className="lg:col-span-3 space-y-6">
            {/* Mini KPIs */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5">
                <p className="text-xs text-slate-500 mb-1">Total Queries</p>
                <p className="text-xl font-semibold text-white">{analytics.totalQueries}</p>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5">
                <p className="text-xs text-slate-500 mb-1">Searches</p>
                <p className="text-xl font-semibold text-white">{analytics.searchCount}</p>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5">
                <p className="text-xs text-slate-500 mb-1">AI Questions</p>
                <p className="text-xl font-semibold text-white">{analytics.askCount}</p>
              </div>
            </div>

            {/* Popular Queries */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6">
              <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                Popular Queries
              </h2>
              <div className="space-y-2">
                {analytics.popularQueries.map((pq, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-md border border-white/[0.04] bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[10px] font-bold text-slate-400">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-sm text-slate-300">{pq.query}</span>
                    <span className="text-xs font-mono text-slate-500">{pq.count}×</span>
                  </div>
                ))}
                {analytics.popularQueries.length === 0 && (
                  <p className="text-xs text-slate-600 text-center py-4">No queries yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Queries + Avg Response Time */}
          <div className="lg:col-span-2 space-y-6">
            {/* Avg Response Time Card */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6">
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                Avg Response Time
              </h2>
              <p className="text-2xl font-semibold text-white">{analytics.avgResponseTime}<span className="text-sm font-normal text-slate-500 ml-1">ms</span></p>
              <div className="mt-3 h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    analytics.avgResponseTime < 500 ? 'bg-emerald-500' :
                    analytics.avgResponseTime < 1500 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min((analytics.avgResponseTime / 3000) * 100, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-600">
                {analytics.avgResponseTime < 500 ? 'Excellent' : analytics.avgResponseTime < 1500 ? 'Good' : 'Slow'} performance
              </p>
            </div>

            {/* Recent Queries */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6">
              <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                Recent Activity
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {analytics.recentQueries.map((rq, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-md border border-white/[0.04] bg-white/[0.02] p-2.5 hover:bg-white/[0.04] transition-colors">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${rq.type === 'ask' ? 'bg-violet-400' : 'bg-sky-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-slate-300">{rq.query}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-medium uppercase ${rq.type === 'ask' ? 'text-violet-400/70' : 'text-sky-400/70'}`}>{rq.type}</span>
                        <span className="text-[9px] text-slate-600">{rq.tookMs}ms</span>
                        <span className="text-[9px] text-slate-600">{new Date(rq.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {analytics.recentQueries.length === 0 && (
                  <p className="text-xs text-slate-600 text-center py-4">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Info */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-500">
          System Architecture
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: 'MongoDB Atlas', detail: 'Vector Search + $vectorSearch pipeline', status: 'Connected', color: 'emerald' },
            { name: 'MiniLM-L6-v2', detail: '384-dim sentence embeddings via FastAPI', status: 'Running', color: 'emerald' },
            { name: 'Groq Llama 3', detail: '70B parameter LLM for RAG generation', status: 'Available', color: 'emerald' },
            { name: 'React + Vite', detail: 'TypeScript frontend with Tailwind CSS', status: 'Active', color: 'emerald' },
          ].map((item) => (
            <div key={item.name} className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/60" />
                <span className="text-xs font-semibold text-slate-300">{item.name}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">{item.detail}</p>
              <p className="mt-2 text-[10px] font-medium text-emerald-400/80">{item.status}</p>
            </div>
          ))}
        </div>
      </div>

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </section>
  );
}

export default DashboardPage;
