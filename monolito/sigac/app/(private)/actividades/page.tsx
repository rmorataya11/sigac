'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { activitiesService } from '@/lib/services/activities';
import { activityDateOnly, type Activity, type ActivityStatusApi } from '@/lib/types';

function statusLabel(s: ActivityStatusApi): string {
  switch (s) {
    case 'DRAFT':
      return 'Borrador';
    case 'CONFIRMED':
      return 'Confirmada';
    case 'CANCELLED':
      return 'Cancelada';
    case 'FINALIZADA':
      return 'Finalizada';
    default:
      return s;
  }
}

export default function ActividadesPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [minimumQuorum, setMinimumQuorum] = useState(1);
  const [participantIds, setParticipantIds] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const load = useCallback(async () => {
    setListError('');
    try {
      const list = await activitiesService.list();
      setActivities(list);
    } catch (e) {
      setListError(e instanceof Error ? e.message : 'No se pudo cargar la lista.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = () => load();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const t = title.trim();
    const d = description.trim();
    if (!t || !date) {
      setFormError('Título y fecha son obligatorios.');
      return;
    }
    if (!startTime || !endTime) {
      setFormError('Indica hora de inicio y fin.');
      return;
    }
    if (minimumQuorum < 1) {
      setFormError('El quórum mínimo debe ser al menos 1.');
      return;
    }
    const ids = participantIds
      .split(/[,;\s]+/)
      .map((x) => x.trim())
      .filter(Boolean);

    setSubmitting(true);
    try {
      await activitiesService.create({
        title: t,
        description: d || undefined,
        activityDate: date,
        startTime,
        endTime,
        minimumQuorum: Math.floor(minimumQuorum),
        participantUserIds: ids.length ? ids : undefined,
      });
      setTitle('');
      setDescription('');
      setDate('');
      setStartTime('09:00');
      setEndTime('10:00');
      setMinimumQuorum(1);
      setParticipantIds('');
      setFormError('');
      await refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo crear.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await activitiesService.cancel(id);
      await refresh();
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'No se pudo cancelar.');
    }
  };

  const sorted = useMemo(
    () =>
      [...activities].sort((a, b) =>
        activityDateOnly(b).localeCompare(activityDateOnly(a))
      ),
    [activities]
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Actividades</h1>

      {listError && (
        <p className="text-sm text-red-300">{listError}</p>
      )}

      {isAdmin && (
        <form onSubmit={handleCreate} className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Nueva actividad</h2>
          {formError && (
            <p className="text-sm text-red-300">{formError}</p>
          )}
          <input
            type="text"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="glass-input w-full rounded-xl px-4 h-11 text-white text-sm"
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="glass-input w-full rounded-xl px-4 py-3 text-white text-sm resize-none"
          />
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
            <div>
              <label className="block text-white/60 text-xs mb-1">Quórum mín.</label>
              <input
                type="number"
                min={1}
                value={minimumQuorum}
                onChange={(e) => setMinimumQuorum(Number(e.target.value))}
                className="glass-input rounded-xl px-4 h-11 text-white text-sm w-24"
              />
            </div>
          </div>
          <div>
            <label className="block text-white/60 text-xs mb-1">
              IDs de participantes (opcional, separados por coma)
            </label>
            <input
              type="text"
              placeholder="id1, id2"
              value={participantIds}
              onChange={(e) => setParticipantIds(e.target.value)}
              className="glass-input w-full rounded-xl px-4 h-11 text-white text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="glass-button px-6 py-2.5 rounded-xl font-medium text-white hover:opacity-95 disabled:opacity-50"
          >
            {submitting ? 'Creando…' : 'Crear actividad'}
          </button>
        </form>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Lista de actividades</h2>
        {loading ? (
          <p className="text-white/50">Cargando…</p>
        ) : (
        <ul className="space-y-2">
          {sorted.length === 0 ? (
            <li className="text-white/50">No hay actividades.</li>
          ) : (
            sorted.map((a) => {
              const canCancel =
                isAdmin && (a.status === 'DRAFT' || a.status === 'CONFIRMED');
              return (
              <li
                key={a.id}
                className="glass-panel rounded-xl px-4 py-3 flex justify-between items-start gap-4"
              >
                <div className="min-w-0">
                  <span className="font-medium">{a.title}</span>
                  <span className="text-white/50 text-sm ml-2">
                    {activityDateOnly(a)} · {a.startTime}–{a.endTime}
                  </span>
                  <span className="text-white/50 text-sm ml-2">
                    ({statusLabel(a.status)})
                  </span>
                  <p className="text-white/70 text-sm mt-1">{a.description ?? '—'}</p>
                  {(a.participants?.length ?? 0) > 0 && (
                    <p className="text-white/50 text-xs mt-1">
                      Participantes:{' '}
                      {(a.participants ?? []).map((p) => p.user.fullName).join(', ')}
                    </p>
                  )}
                </div>
                {canCancel && (
                  <button
                    type="button"
                    onClick={() => handleCancel(a.id)}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-sm text-red-300 hover:bg-red-500/20 transition-colors"
                  >
                    Cancelar
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
