import { useEffect, useState } from 'react';
import { fetchDocuments } from '../api/documents';
import ErrorToast from '../components/ErrorToast';
import type { DocumentItem } from '../types';

function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchDocuments(500)
      .then(setDocuments)
      .catch(() => setError('Failed to load documents'))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...Array.from(new Set(documents.map(d => d.category || 'uncategorized'))).sort()];

  const filtered = documents.filter(doc => {
    const matchesSearch = !search || doc.title.toLowerCase().includes(search.toLowerCase()) || doc.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || (doc.category || 'uncategorized') === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <section className="animate-fadeIn space-y-6">
      {/* Header */}
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-300">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
          Knowledge Base Library
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Documents</h1>
        <p className="mt-1 text-sm text-slate-400">Browse and explore {documents.length} documents in your knowledge base</p>
      </div>

      {/* Filters Bar */}
      <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Search filter */}
        <div className="relative flex-1 w-full">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter documents by title or content..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          {categories.slice(0, 8).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all capitalize ${
                selectedCategory === cat
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'border border-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              {cat}
            </button>
          ))}
          {categories.length > 8 && (
            <span className="text-xs text-slate-600">+{categories.length - 8}</span>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Showing <span className="text-slate-300 font-medium">{filtered.length}</span> of {documents.length} documents
          {selectedCategory !== 'all' && <span> in <span className="text-indigo-400 capitalize">{selectedCategory}</span></span>}
        </p>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 h-32 animate-pulse" />
          ))}
        </div>
      )}

      {/* Documents Grid */}
      {!loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc, i) => (
            <article
              key={doc._id}
              className="glass-light group rounded-2xl p-5 transition-all duration-300 hover:bg-white/[0.06] hover:shadow-glow animate-fadeInUp flex flex-col"
              style={{ animationDelay: `${Math.min(i, 12) * 40}ms`, animationFillMode: 'both' }}
            >
              {/* Category & Date row */}
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex items-center rounded-md bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
                  {doc.category || 'uncategorized'}
                </span>
                <span className="text-[10px] text-slate-600">{formatDate(doc.createdAt)}</span>
              </div>

              {/* Title */}
              <h3 className="mb-2 text-sm font-semibold text-slate-200 group-hover:text-white transition-colors line-clamp-2">
                {doc.title}
              </h3>

              {/* Content preview */}
              <p className="flex-1 text-xs leading-relaxed text-slate-500 group-hover:text-slate-400 transition-colors line-clamp-3">
                {doc.content.slice(0, 180)}...
              </p>

              {/* Tags */}
              {doc.tags && doc.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1 pt-3 border-t border-white/5">
                  {doc.tags.slice(0, 4).map(tag => (
                    <span key={tag} className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-500">{tag}</span>
                  ))}
                  {doc.tags.length > 4 && (
                    <span className="text-[10px] text-slate-600">+{doc.tags.length - 4}</span>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="mt-10 rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <p className="text-slate-500">No documents match your filters.</p>
        </div>
      )}

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </section>
  );
}

export default DocumentsPage;
