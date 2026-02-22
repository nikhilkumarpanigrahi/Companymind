import type { RAGResponse } from '../types';

type AIAnswerProps = {
  data: RAGResponse;
};

function simpleMarkdown(text: string): string {
  // Convert markdown to HTML (basic)
  let html = text
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Unordered list
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    // Source citations
    .replace(/\[Source: (.+?)\]/g, '<span class="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-300 border border-indigo-500/20">📄 $1</span>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');

  // Wrap loose li elements in ul
  html = html.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');

  return `<p>${html}</p>`;
}

function AIAnswer({ data }: AIAnswerProps) {
  return (
    <div className="animate-fadeInUp">
      {/* AI Answer Card */}
      <div className="glass rounded-2xl p-6 shadow-glow">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a8 8 0 0 1 8 8c0 3.5-2 5.5-4 7l-1 4H9l-1-4c-2-1.5-4-3.5-4-7a8 8 0 0 1 8-8z" />
              <path d="M10 22h4" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">CompanyMind AI</h3>
            <p className="text-xs text-slate-500">Powered by {data.meta.model}</p>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              {data.meta.tookMs.toFixed(0)}ms
            </span>
            <span>{data.meta.sourcesUsed} sources</span>
            <span>{data.meta.tokensUsed} tokens</span>
          </div>
        </div>

        <div
          className="ai-answer text-sm leading-relaxed text-slate-300"
          dangerouslySetInnerHTML={{ __html: simpleMarkdown(data.answer) }}
        />
      </div>

      {/* Sources */}
      {data.sources.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
            Sources Retrieved
          </h4>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.sources.map((source, i) => (
              <div
                key={source.id || i}
                className="glass-light rounded-xl p-3 transition-all hover:bg-white/[0.06]"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-500/20 text-[10px] font-bold text-indigo-300">
                    {i + 1}
                  </span>
                  <h5 className="truncate text-xs font-semibold text-slate-300">{source.title}</h5>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500 line-clamp-2">
                  {source.snippet}
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <div className="h-1 w-10 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                      style={{ width: `${Math.round(source.relevanceScore * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-600">
                    {Math.round(source.relevanceScore * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AIAnswer;
