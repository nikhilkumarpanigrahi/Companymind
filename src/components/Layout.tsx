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
    path: '/dashboard',
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
    path: '/benchmarks',
    label: 'Benchmarks',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    path: '/comparison',
    label: 'Search Comparison',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 3h5v5M8 3H3v5M16 21h5v-5M8 21H3v-5M21 3l-8.5 8.5M3 21l8.5-8.5" strokeLinecap="round" strokeLinejoin="round" />
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
    <div className="relative min-h-screen">
      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 z-20 hidden h-screen w-56 flex-col border-r border-white/[0.06] bg-[#0c0c14] lg:flex">
          {/* Logo */}
          <div className="flex h-14 items-center gap-2.5 px-5 border-b border-white/[0.06]">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-white/[0.08]">
              <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-300">
              CompanyMind
            </span>
          </div>

          {/* Nav links */}
          <nav className="flex-1 space-y-0.5 px-3 py-3">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item, location.pathname);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-100 ${
                    active
                      ? 'bg-white/[0.06] text-white'
                      : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-300'
                  }`}
                >
                  <span className={active ? 'text-slate-300' : 'text-slate-600'}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="border-t border-white/[0.06] px-4 py-3">
            <p className="text-[10px] text-slate-700 text-center">
              Vector Search + Groq LLM
            </p>
          </div>
        </aside>

        {/* Mobile top bar */}
        <header className="fixed left-0 right-0 top-0 z-20 flex h-12 items-center justify-between border-b border-white/[0.06] bg-[#0c0c14]/95 backdrop-blur-sm px-4 lg:hidden">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-white/[0.08]">
              <svg className="h-3 w-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-300">CompanyMind</span>
          </Link>
          <nav className="flex items-center gap-0.5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item, location.pathname);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`rounded-md p-1.5 transition-colors ${
                    active ? 'bg-white/[0.06] text-white' : 'text-slate-600 hover:text-slate-400'
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
        <main className="flex-1 pt-12 lg:pt-0 lg:pl-56">
          <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
