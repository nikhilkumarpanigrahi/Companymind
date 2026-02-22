function LoadingSpinner({ message = 'Searching...' }: { message?: string }) {
  return (
    <div className="mt-10 flex flex-col items-center justify-center gap-4 animate-fadeIn">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute inline-flex h-full w-full rounded-full border-2 border-indigo-500/20 animate-pulseRing" />
        <span className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

export default LoadingSpinner;
