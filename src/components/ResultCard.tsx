import type { SearchResultItem } from '../types';

type ResultCardProps = {
  item: SearchResultItem;
};

function ResultCard({ item }: ResultCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight text-slate-900">{item.title}</h3>
        <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          Score {item.relevanceScore.toFixed(2)}
        </span>
      </div>
      <p className="text-sm leading-6 text-slate-600">{item.snippet}</p>
    </article>
  );
}

export default ResultCard;
