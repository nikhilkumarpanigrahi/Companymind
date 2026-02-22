import { useEffect, useState } from 'react';
import { fetchStats } from '../api/documents';
import ErrorToast from '../components/ErrorToast';
import type { StatsData } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  database: 'from-blue-400 to-blue-500',
  'software engineering': 'from-indigo-400 to-indigo-500',
  'AI research': 'from-purple-400 to-purple-500',
  technology: 'from-cyan-400 to-cyan-500',
  devops: 'from-orange-400 to-orange-500',
  backend: 'from-emerald-400 to-emerald-500',
  frontend: 'from-pink-400 to-pink-500',
  NLP: 'from-violet-400 to-violet-500',
  'data science': 'from-amber-400 to-amber-500',
  security: 'from-red-400 to-red-500',
};

function getColor(cat: string) {
  return CATEGORY_COLORS[cat] || 'from-slate-400 to-slate-500';
}

function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(() => setError('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="animate-fadeIn">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Loading knowledge base analytics...</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 h-28 animate-pulse" />
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
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium text-cyan-300">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Knowledge Base Overview
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Real-time analytics of your CompanyMind knowledge base</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass rounded-2xl p-5 group hover:bg-white/[0.04] transition-all">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15">
            <svg className="h-5 w-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalDocuments}</p>
          <p className="text-xs text-slate-500">Total Documents</p>
        </div>

        <div className="glass rounded-2xl p-5 group hover:bg-white/[0.04] transition-all">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15">
            <svg className="h-5 w-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-white">{stats.categories.length}</p>
          <p className="text-xs text-slate-500">Categories</p>
        </div>

        <div className="glass rounded-2xl p-5 group hover:bg-white/[0.04] transition-all">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
            <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-3-3.87M7 21v-2a4 4 0 0 0-4-4h0" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-white">{stats.topTags.length}+</p>
          <p className="text-xs text-slate-500">Unique Tags</p>
        </div>

        <div className="glass rounded-2xl p-5 group hover:bg-white/[0.04] transition-all">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2a8 8 0 0 1 8 8c0 3.5-2 5.5-4 7l-1 4H9l-1-4c-2-1.5-4-3.5-4-7a8 8 0 0 1 8-8z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-white">384</p>
          <p className="text-xs text-slate-500">Vector Dimensions</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Categories Breakdown */}
        <div className="lg:col-span-3 glass rounded-2xl p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <svg className="h-4 w-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12H3M21 6H3M21 18H3" strokeLinecap="round" />
            </svg>
            Categories Distribution
          </h2>
          <div className="space-y-3">
            {topCategories.map((cat) => (
              <div key={cat.name} className="group">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300 capitalize">{cat.name}</span>
                  <span className="text-xs font-mono text-slate-500">{cat.count} docs</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${getColor(cat.name)} transition-all duration-700`}
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
          <div className="glass rounded-2xl p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              Recent Documents
            </h2>
            <div className="space-y-3">
              {stats.recentDocuments.map((doc) => (
                <div key={doc._id} className="flex items-start gap-3 glass-light rounded-xl p-3 hover:bg-white/[0.04] transition-all">
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-300">{doc.title}</p>
                    <p className="text-[10px] text-slate-600 capitalize">{doc.category || 'uncategorized'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Tags */}
          <div className="glass rounded-2xl p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <svg className="h-4 w-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
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

      {/* System Info */}
      <div className="glass rounded-2xl p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <svg className="h-4 w-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
          System Architecture
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: 'MongoDB Atlas', detail: 'Vector Search + $vectorSearch pipeline', status: 'Connected', color: 'emerald' },
            { name: 'MiniLM-L6-v2', detail: '384-dim sentence embeddings via FastAPI', status: 'Running', color: 'emerald' },
            { name: 'Groq Llama 3', detail: '70B parameter LLM for RAG generation', status: 'Available', color: 'emerald' },
            { name: 'React + Vite', detail: 'TypeScript frontend with Tailwind CSS', status: 'Active', color: 'emerald' },
          ].map((item) => (
            <div key={item.name} className="glass-light rounded-xl p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
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
