'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/context/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';

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
    return <LoadingScreen />;
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ width: '100%', height: '100vh', position: 'relative' }}
    >
      <div className="absolute inset-0 z-0">
        <DarkVeil
          hueShift={-8}
          noiseIntensity={0.02}
          scanlineIntensity={0}
          speed={0.35}
          scanlineFrequency={0}
          warpAmount={0}
        />
      </div>
      <div className="auth-veil-overlay" aria-hidden />
      <div className="auth-veil-grain" aria-hidden />
      <div className="auth-modal-wrap">
        <AuthModal />
      </div>
    </div>
  );
}
