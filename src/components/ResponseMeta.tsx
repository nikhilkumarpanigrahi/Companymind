type ResponseMetaProps = {
  tookMs: number | null;
  total: number;
  query: string;
};

function ResponseMeta({ tookMs, total, query }: ResponseMetaProps) {
  if (!query.trim()) {
    return null;
  }

  return (
    <div className="mt-5 flex items-center justify-center gap-4 text-xs text-slate-500">
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        {total} result{total === 1 ? '' : 's'}
      </span>
      {typeof tookMs === 'number' && (
        <span className="flex items-center gap-1.5">
          <svg className="h-3 w-3 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          {tookMs.toFixed(0)}ms
        </span>
      )}
      <span className="text-slate-600">|</span>
      <span className="text-slate-500">Vector Search</span>
    </div>
  );
}

export default ResponseMeta;
