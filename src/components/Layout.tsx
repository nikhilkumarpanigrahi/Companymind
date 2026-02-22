import { Link, useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';

type NavItem = {
  path: string;
  label: string;
  icon: JSX.Element;
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    path: '/',
    label: 'Dashboard',
    exact: true,
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    path: '/search',
    label: 'Search & Ask AI',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    path: '/documents',
    label: 'Documents',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
    ),
  },
  {
    path: '/how-it-works',
    label: 'How It Works',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    path: '/admin',
    label: 'Add Document',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
    ),
  },
];

function isActive(item: NavItem, pathname: string) {
  if (item.exact) return pathname === item.path;
  return pathname.startsWith(item.path);
}

function Layout({ children }: PropsWithChildren) {
  const location = useLocation();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient orbs */}
      <div className="gradient-orb gradient-orb-1" />
      <div className="gradient-orb gradient-orb-2" />
      <div className="gradient-orb gradient-orb-3" />

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 z-20 hidden h-screen w-60 flex-col border-r border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-xl lg:flex">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 px-5 border-b border-white/[0.06]">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-glow">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              Company<span className="text-indigo-400">Mind</span>
            </span>
          </div>

          {/* Nav links */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item, location.pathname);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-indigo-500/15 text-white shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  }`}
                >
                  <span className={active ? 'text-indigo-400' : ''}>{item.icon}</span>
                  {item.label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="border-t border-white/[0.06] px-4 py-4">
            <div className="glass-light rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Powered by MongoDB Atlas Vector Search + Groq LLM
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile top bar */}
        <header className="fixed left-0 right-0 top-0 z-20 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0a0a12]/90 backdrop-blur-xl px-4 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-bold text-white">Company<span className="text-indigo-400">Mind</span></span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item, location.pathname);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`rounded-lg p-2 transition-all ${
                    active ? 'bg-indigo-500/15 text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={item.label}
                >
                  {item.icon}
                </Link>
              );
            })}
          </nav>
        </header>

        {/* Main content */}
        <main className="flex-1 pt-14 lg:pt-0 lg:pl-60">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
