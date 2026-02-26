import { useSpeechToText } from '../hooks/useSpeechToText';

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
  const speech = useSpeechToText({
    lang: 'en-US',
    continuous: false,
    onTranscript: (text) => onChange(text),
    onEnd: (finalText) => {
      onChange(finalText);
      if (mode === 'ask' && finalText.trim()) {
        setTimeout(() => onAsk(), 300);
      }
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && mode === 'ask' && value.trim()) {
      onAsk();
    }
  };

  return (
    <div className="w-full">
      {/* Mode toggle */}
      <div className="mx-auto mb-3 flex w-full max-w-2xl items-center justify-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
        <button
          onClick={() => onModeChange('search')}
          className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[13px] font-medium transition-all duration-150 ${
            mode === 'search'
              ? 'bg-white/[0.08] text-white'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          Search
        </button>
        <button
          onClick={() => onModeChange('ask')}
          className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[13px] font-medium transition-all duration-150 ${
            mode === 'ask'
              ? 'bg-white/[0.08] text-white'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Ask AI
        </button>
      </div>

      {/* Search input */}
      <div className="mx-auto w-full max-w-2xl rounded-lg border border-white/[0.08] bg-white/[0.03] transition-colors duration-150 focus-within:border-white/[0.16] focus-within:bg-white/[0.04]">
        <div className="flex items-center gap-2 px-4 py-3">
          <svg className="h-4 w-4 shrink-0 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              speech.isListening
                ? 'Listening...'
                : mode === 'search'
                  ? 'Search documents...'
                  : 'Ask a question...'
            }
            className="w-full border-none bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
          />

          {/* Voice input */}
          {speech.isSupported && (
            <button
              onClick={speech.toggle}
              type="button"
              title={speech.isListening ? 'Stop listening' : 'Voice input'}
              className={`shrink-0 rounded-md p-1.5 transition-colors duration-150 ${
                speech.isListening
                  ? 'bg-red-500/15 text-red-400'
                  : 'text-slate-500 hover:bg-white/[0.06] hover:text-slate-300'
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </button>
          )}

          {value && !isLoading && (
            <button
              onClick={onClear}
              className="shrink-0 rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-300"
              type="button"
            >
              Clear
            </button>
          )}
          {mode === 'ask' && value.trim() && (
            <button
              onClick={onAsk}
              disabled={isLoading}
              className="shrink-0 rounded-md bg-white/[0.1] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/[0.15] disabled:opacity-40"
              type="button"
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Thinking...
                </span>
              ) : (
                'Ask'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Voice listening indicator */}
      {speech.isListening && (
        <div className="mx-auto mt-2 w-full max-w-2xl">
          <div className="flex items-center justify-center gap-2 rounded-md border border-red-500/15 bg-red-500/5 px-3 py-2 text-xs text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            Listening...
            <button
              onClick={speech.stopListening}
              className="ml-2 text-[11px] text-slate-500 hover:text-slate-300"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Voice error */}
      {speech.error && !speech.isListening && (
        <div className="mx-auto mt-2 w-full max-w-2xl">
          <p className="text-center text-[11px] text-amber-400/70">{speech.error}</p>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
