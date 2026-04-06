'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && user === null) {
      router.replace('/');
    }
  }, [user, ready, router]);

  if (!ready || user === null) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
