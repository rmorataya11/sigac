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
    <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
      <div className="ui-card-enter glass-panel relative w-full max-w-[400px] rounded-2xl p-8 sm:p-9">
        <div className="mb-8 text-center">
          <p className="brand-mark text-[0.6875rem] font-semibold uppercase tracking-[0.22em]">
            SIGAC
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-white">
            {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
          </h2>
          <p className="mt-1.5 text-sm text-zinc-500">
            {isSignUp
              ? 'Acceso como colaborador'
              : 'Entra con tu correo institucional'}
          </p>
        </div>

        <div
          className="relative mb-6 flex rounded-full border border-white/10 bg-zinc-900/50 p-1"
          role="tablist"
        >
          <div
            className="absolute top-1 bottom-1 z-0 rounded-full bg-white/12 shadow-sm transition-all duration-300 ease-out"
            style={{
              left: isSignUp ? 4 : '50%',
              width: 'calc(50% - 4px)',
            }}
          />
          <button
            type="button"
            role="tab"
            aria-selected={isSignUp}
            onClick={() => {
              setIsSignUp(true);
              setError('');
            }}
            className={`relative z-10 flex-1 rounded-full py-2 text-xs font-medium transition-colors duration-300 ${
              isSignUp ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Registro
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isSignUp}
            onClick={() => {
              setIsSignUp(false);
              setError('');
            }}
            className={`relative z-10 flex-1 rounded-full py-2 text-xs font-medium transition-colors duration-300 ${
              !isSignUp ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Entrar
          </button>
        </div>

        {error ? (
          <div className="ui-alert-error mb-5" role="alert">
            {error}
          </div>
        ) : null}

        <div className="relative min-h-[280px]">
          <div
            className="space-y-4 transition-all duration-300 ease-out"
            style={{
              opacity: isSignUp ? 1 : 0,
              transform: isSignUp ? 'translateY(0)' : 'translateY(6px)',
              pointerEvents: isSignUp ? 'auto' : 'none',
              position: isSignUp ? 'relative' : 'absolute',
              inset: isSignUp ? 'auto' : 0,
              visibility: isSignUp ? 'visible' : 'hidden',
            }}
          >
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                  Nombre completo
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input h-11 w-full rounded-xl px-4 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                  Correo
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input h-11 w-full rounded-xl px-4 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                  Contraseña
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input h-11 w-full rounded-xl px-4 text-sm"
                />
              </div>
              <button
                type="submit"
                className="glass-button glass-button-primary mt-2 h-11 w-full rounded-xl text-sm font-medium"
              >
                Crear cuenta
              </button>
            </form>
          </div>

          <div
            className="space-y-4 transition-all duration-300 ease-out"
            style={{
              opacity: !isSignUp ? 1 : 0,
              transform: !isSignUp ? 'translateY(0)' : 'translateY(6px)',
              pointerEvents: !isSignUp ? 'auto' : 'none',
              position: !isSignUp ? 'relative' : 'absolute',
              inset: !isSignUp ? 'auto' : 0,
              visibility: !isSignUp ? 'visible' : 'hidden',
            }}
          >
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                  Correo
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input h-11 w-full rounded-xl px-4 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                  Contraseña
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input h-11 w-full rounded-xl px-4 text-sm"
                />
              </div>
              <button
                type="submit"
                className="glass-button glass-button-primary mt-2 h-11 w-full rounded-xl text-sm font-medium"
              >
                Continuar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
