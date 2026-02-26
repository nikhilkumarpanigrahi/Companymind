import { useEffect, useRef } from 'react';

type ErrorToastProps = {
  message: string;
  onClose: () => void;
};

function ErrorToast({ message, onClose }: ErrorToastProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const timer = window.setTimeout(() => onCloseRef.current(), 5000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300 shadow-lg backdrop-blur-lg animate-fadeInUp">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-semibold text-red-400 transition hover:text-red-300"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default ErrorToast;
