'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function PrivateNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  const link = (href: string, label: string) => {
    const active = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link
        href={href}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          active ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="border-b border-white/10 bg-black/30 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <nav className="flex items-center gap-2">
          {link('/dashboard', 'Dashboard')}
          {link('/actividades', 'Actividades')}
          {link('/disponibilidad', 'Disponibilidad')}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/60">
            {user?.name} <span className="text-white/40">({user?.role})</span>
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
