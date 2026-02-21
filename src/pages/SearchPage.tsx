import { useEffect, useMemo, useState } from 'react';
import { searchDocuments } from '../api/documents';
import ErrorToast from '../components/ErrorToast';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import ResponseMeta from '../components/ResponseMeta';
import ResultCard from '../components/ResultCard';
import SearchBar from '../components/SearchBar';
import { useDebounce } from '../hooks/useDebounce';
import type { SearchResultItem } from '../types';

const DEFAULT_PAGE_SIZE = Number(import.meta.env.VITE_DEFAULT_PAGE_SIZE || 10);

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);

  const debouncedQuery = useDebounce(query, 450);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  useEffect(() => {
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
        if (isCancelled) {
          return;
        }

        setResults(response.results);
        setTotal(response.total);
        setResponseTimeMs(response.tookMs ?? performance.now() - start);
      } catch {
        if (isCancelled) {
          return;
        }
        setError('Search failed. Please check API connection and try again.');
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void runSearch();

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery, page]);

  const isEmpty = useMemo(
    () => Boolean(debouncedQuery.trim()) && !isLoading && results.length === 0,
    [debouncedQuery, isLoading, results.length]
  );

  return (
    <section className="flex min-h-[72vh] flex-col items-center">
      <div className="mt-10 w-full text-center sm:mt-14">
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Search your knowledge base
        </h1>
        <SearchBar value={query} onChange={setQuery} onClear={() => setQuery('')} />
        <ResponseMeta tookMs={responseTimeMs} total={total} query={debouncedQuery} />
      </div>

      <div className="mt-6 w-full max-w-3xl">
        {isLoading && <LoadingSpinner />}

        {!isLoading &&
          results.map((item) => (
            <div key={item.id || `${item.title}-${item.relevanceScore}`} className="mb-4">
              <ResultCard item={item} />
            </div>
          ))}

        {isEmpty && (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            No results found for <span className="font-semibold text-slate-700">“{debouncedQuery}”</span>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <Pagination
            page={page}
            pageSize={DEFAULT_PAGE_SIZE}
            total={total}
            onPageChange={(nextPage) => setPage(nextPage)}
          />
        )}
      </div>

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </section>
  );
}

export default SearchPage;
