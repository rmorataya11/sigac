'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { availabilityService } from '@/lib/services/availability';
import type { Availability, AvailabilityStatus } from '@/lib/types';

export default function DisponibilidadPage() {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<Availability[]>(() => availabilityService.getAll());
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<AvailabilityStatus>('AVAILABLE');
  const [formError, setFormError] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  const refresh = () => setAvailability(availabilityService.getAll());

  const list = useMemo(() => {
    if (isAdmin) return availability;
    return user ? availabilityService.getByUserId(user.id) : [];
  }, [availability, isAdmin, user]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!date) {
      setFormError('Elige una fecha.');
      return;
    }
    if (!user) return;
    const result = availabilityService.register(user.id, user.name, date, status);
    if (result.success) {
      setDate('');
      setFormError('');
      refresh();
    } else {
      setFormError(result.error);
    }
  };

  const handleDelete = (id: string) => {
    availabilityService.deleteById(id);
    refresh();
  };

  const sorted = useMemo(
    () => [...list].sort((a, b) => a.date.localeCompare(b.date)),
    [list]
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Disponibilidad</h1>

      {!isAdmin && user && (
        <form onSubmit={handleRegister} className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Registrar disponibilidad</h2>
          {formError && (
            <p className="text-sm text-red-300">{formError}</p>
          )}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="glass-input rounded-xl px-4 h-11 text-white text-sm"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AvailabilityStatus)}
            className="glass-input rounded-xl px-4 h-11 text-white text-sm"
          >
            <option value="AVAILABLE">Disponible</option>
            <option value="UNAVAILABLE">No disponible</option>
          </select>
          <button type="submit" className="glass-button px-6 py-2.5 rounded-xl font-medium text-white hover:opacity-95">
            Guardar
          </button>
        </form>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">
          {isAdmin ? 'Disponibilidad de todos' : 'Mi disponibilidad'}
        </h2>
        <ul className="space-y-2">
          {sorted.length === 0 ? (
            <li className="text-white/50">No hay registros.</li>
          ) : (
            sorted.map((a) => (
              <li
                key={a.id}
                className="glass-panel rounded-xl px-4 py-3 flex justify-between items-center gap-4"
              >
                <div>
                  {isAdmin && <span className="font-medium">{a.userName}</span>}
                  {isAdmin && <span className="text-white/50 text-sm ml-2"> · </span>}
                  <span className="text-white/80">{a.date}</span>
                  <span className="text-white/50 text-sm ml-2">
                    {a.status === 'AVAILABLE' ? 'Disponible' : 'No disponible'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-sm text-red-300 hover:bg-red-500/20 transition-colors"
                >
                  Eliminar
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
