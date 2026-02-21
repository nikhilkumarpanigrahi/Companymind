function LoadingSpinner() {
  return (
    <div className="mt-10 flex items-center justify-center">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute inline-flex h-full w-full rounded-full border-2 border-indigo-200 animate-pulseRing" />
        <span className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    </div>
  );
}

export default LoadingSpinner;
