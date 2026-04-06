'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && user === null) {
      router.replace('/');
    }
  }, [user, ready, router]);

  if (!ready || user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white/70">
        Cargando...
      </div>
    );
  }

  return <>{children}</>;
}
