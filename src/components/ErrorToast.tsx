import { useEffect } from 'react';

type ErrorToastProps = {
  message: string;
  onClose: () => void;
};

function ErrorToast({ message, onClose }: ErrorToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3500);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-semibold text-rose-700 transition hover:opacity-70"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default ErrorToast;
