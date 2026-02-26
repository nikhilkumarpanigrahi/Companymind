function LoadingSpinner({ message = 'Searching...' }: { message?: string }) {
  return (
    <div className="mt-8 flex flex-col items-center justify-center gap-3">
      <span className="inline-flex h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-slate-400" />
      <p className="text-xs text-slate-600">{message}</p>
    </div>
  );
}

export default LoadingSpinner;
