import { useState } from 'react';
import type { RAGResponse } from '../types';

type AIAnswerProps = {
  data: RAGResponse;
  compact?: boolean;
};

function simpleMarkdown(text: string): string {
  let html = text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');

  html = html.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
  return `<p>${html}</p>`;
}

function AIAnswer({ data, compact }: AIAnswerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback: do nothing */ }
  };

  if (compact) {
    return (
      <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="ai-answer text-xs leading-relaxed text-slate-500 line-clamp-3"
          dangerouslySetInnerHTML={{ __html: simpleMarkdown(data.answer) }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.06]">
            <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-300">AI Answer</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-600">
            <span>{data.meta.tookMs.toFixed(0)}ms</span>
            <span>{data.meta.sourcesUsed} sources</span>
            <span className="text-slate-700">{data.meta.model}</span>
          </div>
        </div>

        <div
          className="ai-answer text-sm leading-relaxed text-slate-400"
          dangerouslySetInnerHTML={{ __html: simpleMarkdown(data.answer) }}
        />

        {/* Copy button */}
        <div className="mt-3 flex items-center border-t border-white/[0.04] pt-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-300"
          >
            {copied ? (
              <>
                <svg className="h-3 w-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sources */}
      {data.sources.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-600">
            Sources
          </p>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {data.sources.map((source, i) => {
              const pct = Math.round(source.relevanceScore * 100);
              const scoreBg =
                pct >= 80 ? 'bg-emerald-500/15 text-emerald-400' :
                pct >= 60 ? 'bg-blue-500/15 text-blue-400' :
                'bg-slate-500/15 text-slate-400';
              return (
                <div
                  key={source.id || i}
                  className="rounded-md border border-white/[0.06] bg-white/[0.02] p-2.5 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h5 className="truncate text-xs font-medium text-slate-400">{source.title}</h5>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${scoreBg}`}>
                      {pct}%
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600 line-clamp-2">
                    {source.snippet}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default AIAnswer;
