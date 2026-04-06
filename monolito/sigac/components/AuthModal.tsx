'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const MIN_PASSWORD = 8;

export default function AuthModal() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail || !password) {
      setError('Completa nombre, email y contraseña.');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    const result = await register(trimmedName, trimmedEmail, password);
    if (result.success) {
      setName('');
      setEmail('');
      setPassword('');
      router.push('/dashboard');
    } else {
      setError(result.error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Ingresa email y contraseña.');
      return;
    }
    const result = await login(trimmedEmail, password);
    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-panel w-full max-w-[380px] min-h-[460px] rounded-2xl p-6 relative my-auto flex flex-col">
        <div className="relative flex gap-0.5 p-1 rounded-full bg-white/10 mb-6 w-fit">
          <span
            className="absolute top-1 bottom-1 rounded-full bg-white/25 border border-white/20 pointer-events-none"
            style={{
              left: isSignUp ? 4 : 'calc(50% + 2px)',
              width: 'calc(50% - 6px)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
              transition: 'left 0.3s ease-out'
            }}
          />
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`relative z-1 w-[100px] py-1.5 rounded-full text-xs font-medium transition-colors duration-300 whitespace-nowrap ${isSignUp ? 'text-white' : 'text-white/60 hover:text-white/85'}`}
          >
            Registro
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`relative z-1 w-[100px] py-1.5 rounded-full text-xs font-medium transition-colors duration-300 whitespace-nowrap ${!isSignUp ? 'text-white' : 'text-white/60 hover:text-white/85'}`}
          >
            Iniciar sesión
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg bg-red-500/20 border border-red-400/40 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}
        <div className="relative min-h-[320px] flex-1">
          <div
            className="absolute inset-0 space-y-3"
            style={{
              opacity: isSignUp ? 1 : 0,
              transform: isSignUp ? 'translateY(0)' : 'translateY(-6px)',
              pointerEvents: isSignUp ? 'auto' : 'none',
              transition: 'opacity 0.2s ease-out, transform 0.2s ease-out'
            }}
          >
            <h1 className="text-xl font-bold text-white mb-4">Crear cuenta</h1>
            <p className="text-white/55 text-xs mb-2">
              El registro público crea una cuenta con rol colaborador.
            </p>
            <form onSubmit={handleRegister} className="space-y-3">
              <input
                type="text"
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full rounded-lg px-3 h-10 text-white text-sm"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <path d="M22 6l-10 7L2 6" />
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full rounded-lg pl-9 pr-3 h-10 text-white text-sm"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type="password"
                  placeholder="Contraseña (mín. 8 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full rounded-lg pl-9 pr-3 h-10 text-white text-sm"
                />
              </div>
              <button type="submit" className="glass-button w-full h-10 rounded-lg font-medium text-white text-sm hover:opacity-95 transition-opacity mt-1">
                Crear cuenta
              </button>
            </form>
          </div>

          <div
            className="absolute inset-0 space-y-3"
            style={{
              opacity: !isSignUp ? 1 : 0,
              transform: !isSignUp ? 'translateY(0)' : 'translateY(6px)',
              pointerEvents: !isSignUp ? 'auto' : 'none',
              transition: 'opacity 0.2s ease-out, transform 0.2s ease-out'
            }}
          >
            <h1 className="text-xl font-bold text-white mb-4">Bienvenido</h1>
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <path d="M22 6l-10 7L2 6" />
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full rounded-lg pl-9 pr-3 h-10 text-white text-sm"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full rounded-lg pl-9 pr-3 h-10 text-white text-sm"
                />
              </div>
              <button type="submit" className="glass-button w-full h-10 rounded-lg font-medium text-white text-sm hover:opacity-95 transition-opacity">
                Iniciar sesión
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
