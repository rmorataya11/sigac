'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { availabilityService } from '@/lib/services/availability';
import type { Availability } from '@/lib/types';
import { availabilityDateOnly } from '@/lib/types';
import PageHeader from '@/components/PageHeader';

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
    [availability],
  );

  const displayName = (a: Availability) =>
    a.user?.fullName ?? (a.userId === user?.id ? user.name : a.userId);

  return (
    <div>
      <PageHeader
        title="Disponibilidad"
        description={
          isAdmin
            ? 'Vista global de franjas registradas por el equipo.'
            : 'Registra cuándo puedes participar; evitamos solapes en el mismo día.'
        }
      />

      {listError ? (
        <div className="ui-alert-error mb-6" role="alert">
          {listError}
        </div>
      ) : null}

      {!isAdmin && user ? (
        <form
          onSubmit={handleRegister}
          className="glass-panel mb-10 space-y-5 rounded-2xl p-6 sm:p-7"
        >
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Registrar franja
            </h2>
            <p className="mt-1 text-xs text-zinc-600">
              No puede solaparse con otro registro tuyo el mismo día.
            </p>
          </div>
          {formError ? (
            <div className="ui-alert-error" role="alert">
              {formError}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="glass-input h-11 rounded-xl px-4 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                Inicio
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="glass-input h-11 rounded-xl px-4 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                Fin
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="glass-input h-11 rounded-xl px-4 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="glass-button glass-button-primary h-11 rounded-xl px-6 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? 'Guardando…' : 'Guardar'}
          </button>
        </form>
      ) : null}

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          {isAdmin ? 'Todos los colaboradores' : 'Tus franjas'}
        </h2>
        {loading ? (
          <div className="space-y-3">
            <div className="ui-skeleton h-16 rounded-xl" />
            <div className="ui-skeleton h-16 rounded-xl" />
            <div className="ui-skeleton h-16 rounded-xl" />
          </div>
        ) : (
          <ul className="space-y-3">
            {sorted.length === 0 ? (
              <li className="text-sm text-zinc-500">No hay registros.</li>
            ) : (
              sorted.map((a) => {
                const canDelete = user && a.userId === user.id;
                return (
                  <li
                    key={a.id}
                    className="glass-panel glass-panel-interactive flex flex-col gap-2 rounded-xl px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      {isAdmin ? (
                        <span className="font-medium text-zinc-200">
                          {displayName(a)}
                        </span>
                      ) : null}
                      {isAdmin ? (
                        <span className="text-zinc-600"> · </span>
                      ) : null}
                      <span className="text-zinc-300">{availabilityDateOnly(a)}</span>
                      <span className="ml-2 text-sm text-zinc-500">
                        {a.startTime} – {a.endTime}
                      </span>
                    </div>
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
                        className="shrink-0 self-start rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-all duration-200 hover:border-red-500/40 hover:bg-red-500/20 active:scale-[0.98] sm:self-center"
                      >
                        Eliminar
                      </button>
                    ) : null}
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
