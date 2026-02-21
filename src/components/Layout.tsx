import { Link, useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';

const linkClass = (active: boolean) =>
  `rounded-full px-4 py-2 text-sm font-medium transition ${
    active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white hover:text-slate-900'
  }`;

function Layout({ children }: PropsWithChildren) {
  const location = useLocation();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-10 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold tracking-tight text-slate-900">
          Companymind
        </Link>
        <nav className="flex items-center gap-2 rounded-full bg-slate-100 p-1">
          <Link to="/" className={linkClass(location.pathname === '/')}>Search</Link>
          <Link to="/admin" className={linkClass(location.pathname.startsWith('/admin'))}>
            Admin
          </Link>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default Layout;
