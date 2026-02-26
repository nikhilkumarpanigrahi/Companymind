import type { SearchResultItem } from '../types';

type ResultCardProps = {
  item: SearchResultItem;
  index: number;
};

function ResultCard({ item, index }: ResultCardProps) {
  const scorePercent = Math.round(item.relevanceScore * 100);
  const scoreBg =
    scorePercent >= 80 ? 'bg-emerald-500/15 text-emerald-400' :
    scorePercent >= 60 ? 'bg-blue-500/15 text-blue-400' :
    'bg-slate-500/15 text-slate-400';
  const barBg =
    scorePercent >= 80 ? 'bg-emerald-500' :
    scorePercent >= 60 ? 'bg-blue-500' :
    'bg-slate-500';

  return (
    <article className="group rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 transition-colors duration-150 hover:border-white/[0.12] hover:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-semibold text-slate-500 bg-white/[0.06]">
            {index + 1}
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-slate-200 leading-snug truncate">
              {item.title}
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 line-clamp-2">
              {item.snippet}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold tabular-nums ${scoreBg}`}>
            {scorePercent}% match
          </span>
          <div className="h-1 w-14 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full ${barBg} transition-all duration-300`}
              style={{ width: `${scorePercent}%` }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export default ResultCard;
