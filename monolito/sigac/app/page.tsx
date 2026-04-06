'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/context/AuthContext';

const DarkVeil = dynamic(() => import('@/components/DarkVeil'), { ssr: false });

export default function Home() {
  const router = useRouter();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (ready && user) {
      router.replace('/dashboard');
    }
  }, [ready, user, router]);

  if (!ready || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white/70">
        Cargando...
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ width: '100%', height: '100vh', position: 'relative' }}
    >
      <DarkVeil
        hueShift={0}
        noiseIntensity={0}
        scanlineIntensity={0}
        speed={0.5}
        scanlineFrequency={0}
        warpAmount={0}
      />
      <AuthModal />
    </div>
  );
}
