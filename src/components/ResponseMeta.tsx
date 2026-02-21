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
    <p className="mt-5 text-sm text-slate-500">
      {total} result{total === 1 ? '' : 's'}
      {typeof tookMs === 'number' ? ` in ${tookMs.toFixed(0)} ms` : ''}
    </p>
  );
}

export default ResponseMeta;
