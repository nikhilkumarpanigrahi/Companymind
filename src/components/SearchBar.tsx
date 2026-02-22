type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  mode: 'search' | 'ask';
  onModeChange: (mode: 'search' | 'ask') => void;
  onAsk: () => void;
  isLoading?: boolean;
};

function SearchBar({ value, onChange, onClear, mode, onModeChange, onAsk, isLoading }: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && mode === 'ask' && value.trim()) {
      onAsk();
    }
  };

  return (
    <div className="w-full">
      {/* Mode toggle */}
      <div className="mx-auto mb-4 flex w-full max-w-2xl items-center justify-center gap-2">
        <button
          onClick={() => onModeChange('search')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
            mode === 'search'
              ? 'bg-indigo-500/20 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          Semantic Search
        </button>
        <button
          onClick={() => onModeChange('ask')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
            mode === 'ask'
              ? 'bg-purple-500/20 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a8 8 0 0 1 8 8c0 3.5-2 5.5-4 7l-1 4H9l-1-4c-2-1.5-4-3.5-4-7a8 8 0 0 1 8-8z" />
            <path d="M10 22h4" />
          </svg>
          Ask AI
        </button>
      </div>

      {/* Search input */}
      <div className={`mx-auto w-full max-w-2xl rounded-2xl transition-all duration-300 ${
        mode === 'ask'
          ? 'glass shadow-[0_0_30px_rgba(168,85,247,0.1)] focus-within:shadow-[0_0_50px_rgba(168,85,247,0.2)]'
          : 'glass shadow-[0_0_30px_rgba(99,102,241,0.1)] focus-within:shadow-[0_0_50px_rgba(99,102,241,0.2)]'
      }`}>
        <div className="flex items-center gap-3 px-5 py-4">
          {mode === 'search' ? (
            <svg className="h-5 w-5 shrink-0 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          ) : (
            <svg className="h-5 w-5 shrink-0 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a8 8 0 0 1 8 8c0 3.5-2 5.5-4 7l-1 4H9l-1-4c-2-1.5-4-3.5-4-7a8 8 0 0 1 8-8z" />
              <path d="M10 22h4" />
            </svg>
          )}
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'search' ? 'Search your knowledge base...' : 'Ask a question about your documents...'}
            className="w-full border-none bg-transparent text-base text-white outline-none placeholder:text-slate-500 sm:text-lg"
          />
          {value && !isLoading && (
            <button
              onClick={onClear}
              className="shrink-0 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-white"
              type="button"
            >
              Clear
            </button>
          )}
          {mode === 'ask' && value.trim() && (
            <button
              onClick={onAsk}
              disabled={isLoading}
              className="shrink-0 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-glow disabled:opacity-50"
              type="button"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Thinking...
                </span>
              ) : (
                'Ask'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchBar;
