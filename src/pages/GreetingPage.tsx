import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function GreetingPage() {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  const handleEnter = () => {
    setFadeOut(true);
    setTimeout(() => navigate('/dashboard', { replace: true }), 700);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f] transition-opacity duration-700 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-indigo-600/[0.07] blur-[120px] animate-pulse" />
      </div>

      <div className="relative flex flex-col items-center gap-6 animate-[fadeInUp_0.8s_ease-out_both]">
        {/* Logo */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/[0.06] border border-white/[0.08] shadow-lg shadow-indigo-500/10 animate-[scaleIn_0.6s_ease-out_both]">
          <svg
            className="h-10 w-10 text-indigo-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Company name */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl animate-[fadeInUp_0.8s_ease-out_0.2s_both]">
            Company<span className="text-indigo-400">Mind</span>
          </h1>
          <p className="mt-3 text-sm text-slate-500 animate-[fadeInUp_0.8s_ease-out_0.4s_both]">
            AI-Powered Knowledge Base &amp; Semantic Search
          </p>
        </div>

        {/* Enter button */}
        <button
          onClick={handleEnter}
          className="mt-6 group flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-7 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-indigo-500/30 hover:bg-indigo-500/10 hover:text-white hover:shadow-lg hover:shadow-indigo-500/10 animate-[fadeInUp_0.8s_ease-out_0.6s_both]"
        >
          Get Started
          <svg
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <p className="text-[11px] text-slate-700 animate-[fadeInUp_0.8s_ease-out_0.8s_both]">
          Vector Search + Groq LLM
        </p>
      </div>
    </div>
  );
}

export default GreetingPage;
