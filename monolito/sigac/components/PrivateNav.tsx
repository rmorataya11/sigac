'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function PrivateNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const navItems =
    user?.role === 'ADMIN'
      ? ([
          { href: '/dashboard', label: 'Panel' },
          { href: '/actividades', label: 'Actividades' },
          { href: '/disponibilidad', label: 'Disponibilidad' },
          { href: '/auditoria', label: 'Auditoría' },
        ] as const)
      : ([
          { href: '/dashboard', label: 'Panel' },
          { href: '/actividades', label: 'Actividades' },
          { href: '/disponibilidad', label: 'Disponibilidad' },
        ] as const);

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-zinc-950/75 backdrop-blur-xl backdrop-saturate-150 transition-[background,backdrop-filter] duration-300">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            className="brand-mark text-sm font-semibold tracking-tight transition-opacity duration-200 hover:opacity-90"
          >
            SIGAC
          </Link>
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Principal">
            {navItems.map(({ href, label }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`nav-link ${active ? 'nav-link-active' : ''}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden min-w-0 text-right sm:block">
            <p className="truncate text-sm font-medium text-zinc-100">
              {user?.name}
            </p>
            <p className="text-[0.6875rem] uppercase tracking-wider text-zinc-500">
              {user?.role === 'ADMIN' ? 'Administrador' : 'Colaborador'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.08] hover:text-white active:scale-[0.98]"
          >
            Salir
          </button>
        </div>
      </div>
      <nav
        className="flex gap-1 border-t border-white/[0.04] px-4 py-2 sm:hidden"
        aria-label="Principal móvil"
      >
        {navItems.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`nav-link flex-1 text-center text-xs ${active ? 'nav-link-active' : ''}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
