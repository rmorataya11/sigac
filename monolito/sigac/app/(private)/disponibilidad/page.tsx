'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { availabilityService } from '@/lib/services/availability';
import type { Availability } from '@/lib/types';
import { availabilityDateOnly } from '@/lib/types';

export default function DisponibilidadPage() {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const load = useCallback(async () => {
    if (!user) {
      setAvailability([]);
      setLoading(false);
      return;
    }
    setListError('');
    try {
      const list = isAdmin
        ? await availabilityService.listGlobal()
        : await availabilityService.listMine();
      setAvailability(list);
    } catch (e) {
      setListError(e instanceof Error ? e.message : 'No se pudo cargar.');
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!date || !startTime || !endTime) {
      setFormError('Completa fecha, hora de inicio y fin.');
      return;
    }
    setSubmitting(true);
    try {
      await availabilityService.create({ date, startTime, endTime });
      setDate('');
      setStartTime('09:00');
      setEndTime('12:00');
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await availabilityService.remove(id);
      await load();
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'No se pudo eliminar.');
    }
  };

  const sorted = useMemo(
    () =>
      [...availability].sort((a, b) => {
        const d = availabilityDateOnly(a).localeCompare(availabilityDateOnly(b));
        if (d !== 0) return d;
        return a.startTime.localeCompare(b.startTime);
      }),
    [availability]
  );

  const displayName = (a: Availability) =>
    a.user?.fullName ?? (a.userId === user?.id ? user.name : a.userId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Disponibilidad</h1>

      {listError && (
        <p className="text-sm text-red-300">{listError}</p>
      )}

      {!isAdmin && user && (
        <form onSubmit={handleRegister} className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Registrar disponibilidad</h2>
          <p className="text-white/55 text-xs">
            Indica en qué franja horaria estás disponible ese día. No puede solaparse con otro registro tuyo el mismo día.
          </p>
          {formError && (
            <p className="text-sm text-red-300">{formError}</p>
          )}
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-white/60 text-xs mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="glass-input rounded-xl px-4 h-11 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs mb-1">Inicio</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="glass-input rounded-xl px-4 h-11 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs mb-1">Fin</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="glass-input rounded-xl px-4 h-11 text-white text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="glass-button px-6 py-2.5 rounded-xl font-medium text-white hover:opacity-95 disabled:opacity-50"
          >
            {submitting ? 'Guardando…' : 'Guardar'}
          </button>
        </form>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">
          {isAdmin ? 'Disponibilidad de todos' : 'Mi disponibilidad'}
        </h2>
        {loading ? (
          <p className="text-white/50">Cargando…</p>
        ) : (
        <ul className="space-y-2">
          {sorted.length === 0 ? (
            <li className="text-white/50">No hay registros.</li>
          ) : (
            sorted.map((a) => {
              const canDelete = user && a.userId === user.id;
              return (
              <li
                key={a.id}
                className="glass-panel rounded-xl px-4 py-3 flex justify-between items-center gap-4"
              >
                <div>
                  {isAdmin && (
                    <span className="font-medium">{displayName(a)}</span>
                  )}
                  {isAdmin && <span className="text-white/50 text-sm ml-2"> · </span>}
                  <span className="text-white/80">{availabilityDateOnly(a)}</span>
                  <span className="text-white/50 text-sm ml-2">
                    {a.startTime} – {a.endTime}
                  </span>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-sm text-red-300 hover:bg-red-500/20 transition-colors"
                  >
                    Eliminar
                  </button>
                )}
              </li>
            );
            })
          )}
        </ul>
        )}
      </section>
    </div>
  );
}
