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
    <div className="fixed bottom-5 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 rounded-md border border-red-500/15 bg-[#1a0a0a] px-4 py-3 text-red-400 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-red-500/50 transition hover:text-red-400"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default ErrorToast;
