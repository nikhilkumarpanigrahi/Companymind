import type { SearchResultItem } from '../types';

type ResultCardProps = {
  item: SearchResultItem;
  index: number;
};

function ResultCard({ item, index }: ResultCardProps) {
  const scorePercent = Math.round(item.relevanceScore * 100);
  const scoreColor =
    scorePercent >= 80 ? 'from-emerald-400 to-emerald-500' :
    scorePercent >= 60 ? 'from-indigo-400 to-indigo-500' :
    'from-slate-400 to-slate-500';

  return (
    <article
      className="glass-light group rounded-2xl p-5 transition-all duration-300 hover:bg-white/[0.06] hover:shadow-glow animate-fadeInUp"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-slate-500">
            {index + 1}
          </span>
          <h3 className="text-base font-semibold tracking-tight text-slate-200 group-hover:text-white transition-colors">
            {item.title}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-1.5 w-16 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${scoreColor} transition-all duration-500`}
              style={{ width: `${scorePercent}%` }}
            />
          </div>
          <span className="text-xs font-mono font-medium text-slate-400">
            {scorePercent}%
          </span>
        </div>
      </div>
      <p className="ml-9 text-sm leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors">
        {item.snippet}
      </p>
    </article>
  );
}

export default ResultCard;
