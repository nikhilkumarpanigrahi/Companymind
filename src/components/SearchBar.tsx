type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
};

function SearchBar({ value, onChange, onClear }: SearchBarProps) {
  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-2xl rounded-full border border-slate-200 bg-white px-6 py-4 shadow-soft transition focus-within:border-indigo-300 focus-within:shadow-lg">
        <div className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-slate-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.5 3a5.5 5.5 0 014.351 8.863l3.643 3.644a1 1 0 01-1.414 1.414l-3.643-3.644A5.5 5.5 0 118.5 3zm0 2a3.5 3.5 0 100 7 3.5 3.5 0 000-7z"
              clipRule="evenodd"
            />
          </svg>
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Search documents..."
            className="w-full border-none bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 sm:text-lg"
          />
          {value && (
            <button
              onClick={onClear}
              className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-200"
              type="button"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchBar;
