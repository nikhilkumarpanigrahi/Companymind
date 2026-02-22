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
      // Auto-trigger ask if in ask mode
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
            placeholder={
              speech.isListening
                ? 'Listening...'
                : mode === 'search'
                  ? 'Search your knowledge base...'
                  : 'Ask a question about your documents...'
            }
            className="w-full border-none bg-transparent text-base text-white outline-none placeholder:text-slate-500 sm:text-lg"
          />

          {/* Voice input button */}
          {speech.isSupported && (
            <button
              onClick={speech.toggle}
              type="button"
              title={speech.isListening ? 'Stop listening' : 'Voice input'}
              className={`relative shrink-0 rounded-xl p-2.5 transition-all duration-300 ${
                speech.isListening
                  ? 'bg-red-500/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {/* Pulse rings when listening */}
              {speech.isListening && (
                <>
                  <span className="absolute inset-0 rounded-xl animate-ping bg-red-500/10" />
                  <span className="absolute inset-[-4px] rounded-2xl border-2 border-red-500/20 animate-pulseRing" />
                </>
              )}
              <svg className="relative h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </button>
          )}

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

      {/* Voice listening indicator */}
      {speech.isListening && (
        <div className="mx-auto mt-3 w-full max-w-2xl animate-fadeIn">
          <div className="flex items-center justify-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5">
            {/* Waveform animation */}
            <div className="flex items-center gap-[3px]">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-red-400 animate-voiceWave"
                  style={{
                    animationDelay: `${i * 0.15}s`,
                    height: '16px',
                  }}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-red-300">
              Listening... speak your {mode === 'ask' ? 'question' : 'search query'}
            </span>
            <button
              onClick={speech.stopListening}
              className="ml-auto rounded-lg bg-red-500/20 px-2.5 py-1 text-[10px] font-semibold text-red-300 transition hover:bg-red-500/30"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Voice error */}
      {speech.error && !speech.isListening && (
        <div className="mx-auto mt-2 w-full max-w-2xl animate-fadeIn">
          <p className="text-center text-[11px] text-amber-400/80">{speech.error}</p>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
