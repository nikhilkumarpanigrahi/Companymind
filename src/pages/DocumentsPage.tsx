import { useEffect, useState, useCallback } from 'react';
import { fetchDocuments } from '../api/documents';
import type { FetchDocumentsResponse } from '../api/documents';
import ErrorToast from '../components/ErrorToast';
import Pagination from '../components/Pagination';
import type { DocumentItem } from '../types';
import { useDebounce } from '../hooks/useDebounce';

function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const debouncedSearch = useDebounce(search, 300);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res: FetchDocumentsResponse = await fetchDocuments({
        page,
        pageSize,
        search: debouncedSearch,
        category: selectedCategory === 'all' ? '' : selectedCategory,
      });
      setDocuments(res.data);
      setTotal(res.total);
      if (res.categories.length > 0) setCategories(res.categories);
    } catch {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, selectedCategory]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, selectedCategory]);

  const allCategories = ['all', ...categories];
  const filtered = documents; // Already filtered server-side

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <section className="animate-fadeIn space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Documents</h1>
        <p className="mt-1 text-sm text-slate-500">Browse {documents.length} documents in your knowledge base</p>
      </div>

      {/* Filters Bar */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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
            className="w-full rounded-md border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-white/[0.16]"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          {allCategories.slice(0, 8).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all capitalize ${
                selectedCategory === cat
                  ? 'bg-white/[0.08] text-white border border-white/[0.12]'
                  : 'border border-white/[0.06] text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              {cat}
            </button>
          ))}
          {allCategories.length > 8 && (
            <span className="text-xs text-slate-600">+{allCategories.length - 8}</span>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Showing <span className="text-slate-300 font-medium">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}</span> of {total} documents
          {selectedCategory !== 'all' && <span> in <span className="text-indigo-400 capitalize">{selectedCategory}</span></span>}
        </p>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5 h-32 animate-pulse" />
          ))}
        </div>
      )}

      {/* Documents Grid */}
      {!loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc, i) => (
            <article
              key={doc._id}
              className="group rounded-lg border border-white/[0.06] bg-white/[0.02] p-5 transition-colors duration-150 hover:bg-white/[0.04] hover:border-white/[0.12] animate-fadeInUp flex flex-col"
              style={{ animationDelay: `${Math.min(i, 12) * 40}ms`, animationFillMode: 'both' }}
            >
              {/* Category & Date row */}
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex items-center rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
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

      {/* Pagination */}
      {!loading && total > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      {!loading && filtered.length === 0 && (
        <div className="mt-10 rounded-lg border border-white/[0.06] bg-white/[0.02] p-10 text-center">
          <p className="text-slate-500">No documents match your filters.</p>
        </div>
      )}

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </section>
  );
}

export default DocumentsPage;
