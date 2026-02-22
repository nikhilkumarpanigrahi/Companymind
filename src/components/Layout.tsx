import { Link, useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';

const navLink = (active: boolean) =>
  `relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
    active
      ? 'text-white bg-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
      : 'text-slate-400 hover:text-white hover:bg-white/5'
  }`;

function Layout({ children }: PropsWithChildren) {
  const location = useLocation();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient orbs */}
      <div className="gradient-orb gradient-orb-1" />
      <div className="gradient-orb gradient-orb-2" />
      <div className="gradient-orb gradient-orb-3" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="glass mb-8 flex items-center justify-between rounded-2xl px-6 py-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-glow transition-shadow group-hover:shadow-glow-lg">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Company<span className="text-indigo-400">Mind</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 rounded-xl bg-white/5 p-1">
            <Link to="/" className={navLink(location.pathname === '/')}>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                Search
              </span>
            </Link>
            <Link to="/admin" className={navLink(location.pathname.startsWith('/admin'))}>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                Add Doc
              </span>
            </Link>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="mt-12 border-t border-white/5 py-6 text-center">
          <p className="text-xs text-slate-500">
            Built with MongoDB Atlas Vector Search, Sentence Transformers & Groq LLM
          </p>
        </footer>
      </div>
    </div>
  );
}

export default Layout;
