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
    <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-slate-600">
      <span>{total} result{total === 1 ? '' : 's'}</span>
      {typeof tookMs === 'number' && (
        <>
          <span className="text-slate-700">·</span>
          <span>{tookMs.toFixed(0)}ms</span>
        </>
      )}
      <span className="text-slate-700">·</span>
      <span>Semantic search</span>
    </div>
  );
}

export default ResponseMeta;
