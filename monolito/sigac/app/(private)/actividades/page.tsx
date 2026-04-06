'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { activitiesService } from '@/lib/services/activities';
import { availabilityService } from '@/lib/services/availability';
import {
  activityDateOnly,
  type Activity,
  type ActivityStatusApi,
  type Availability,
} from '@/lib/types';
import PageHeader from '@/components/PageHeader';
import { activityStatusBadgeClass } from '@/lib/ui/activity-status-badge';

function uniqueUsersFromAvailability(rows: Availability[]): {
  id: string;
  fullName: string;
  email: string;
}[] {
  const map = new Map<string, { id: string; fullName: string; email: string }>();
  for (const row of rows) {
    const id = row.user?.id ?? row.userId;
    const fullName = row.user?.fullName?.trim() || 'Usuario';
    const email = row.user?.email ?? '';
    if (!map.has(id)) {
      map.set(id, { id, fullName, email });
    }
  }
  return [...map.values()].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, 'es'),
  );
}

function appendParticipantId(current: string, id: string): string {
  const set = new Set(
    current
      .split(/[,;\s]+/)
      .map((x) => x.trim())
      .filter(Boolean),
  );
  if (set.has(id)) {
    return current;
  }
  set.add(id);
  return [...set].join(', ');
}

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
  const [teamUsers, setTeamUsers] = useState<
    { id: string; fullName: string; email: string }[]
  >([]);
  const [teamListError, setTeamListError] = useState('');
  const [pickListKey, setPickListKey] = useState(0);

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

  useEffect(() => {
    if (!isAdmin) {
      setTeamUsers([]);
      setTeamListError('');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const rows = await availabilityService.listGlobal();
        if (cancelled) {
          return;
        }
        setTeamUsers(uniqueUsersFromAvailability(rows));
        setTeamListError('');
      } catch {
        if (!cancelled) {
          setTeamListError('No se pudo cargar la lista de personas con disponibilidad.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

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
        activityDateOnly(b).localeCompare(activityDateOnly(a)),
      ),
    [activities],
  );

  return (
    <div>
      <PageHeader
        title="Actividades"
        description="Consulta el calendario colaborativo. Como administrador puedes crear nuevas actividades en borrador."
      />

      {listError ? (
        <div className="ui-alert-error mb-6" role="alert">
          {listError}
        </div>
      ) : null}

      {isAdmin ? (
        <form
          onSubmit={handleCreate}
          className="glass-panel mb-10 space-y-5 rounded-2xl p-6 sm:p-7"
        >
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Nueva actividad
            </h2>
            <p className="mt-1 text-xs text-zinc-600">
              Se crea en borrador hasta confirmarla.
            </p>
          </div>
          {formError ? (
            <div className="ui-alert-error" role="alert">
              {formError}
            </div>
          ) : null}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">
              Título
            </label>
            <input
              type="text"
              placeholder="Ej. Reunión de equipo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input h-11 w-full rounded-xl px-4 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">
              Descripción (opcional)
            </label>
            <textarea
              placeholder="Detalles o notas"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="glass-input w-full resize-none rounded-xl px-4 py-3 text-sm"
            />
          </div>
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
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                Quórum mín.
              </label>
              <input
                type="number"
                min={1}
                value={minimumQuorum}
                onChange={(e) => setMinimumQuorum(Number(e.target.value))}
                className="glass-input h-11 w-24 rounded-xl px-4 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">
              Participantes (opcional)
            </label>
            <p className="mb-2 text-xs text-zinc-600">
              Pueden ser administradores o colaboradores: quienes aparezcan aquí deben tener
              disponibilidad que cubra el horario de la actividad. No hace falta abrir la base de
              datos: usa tu usuario o el listado.
            </p>
            <div className="mb-2 flex flex-wrap gap-2">
              {user ? (
                <button
                  type="button"
                  onClick={() =>
                    setParticipantIds((prev) => appendParticipantId(prev, user.id))
                  }
                  className="rounded-lg border border-zinc-600/60 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
                >
                  Añadir mi usuario
                </button>
              ) : null}
            </div>
            {teamListError ? (
              <p className="mb-2 text-xs text-amber-400/90">{teamListError}</p>
            ) : null}
            {teamUsers.length > 0 ? (
              <div className="mb-2">
                <label className="mb-1 block text-xs text-zinc-500">
                  Añadir quien ya registró disponibilidad
                </label>
                <select
                  key={pickListKey}
                  defaultValue=""
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) {
                      return;
                    }
                    setParticipantIds((prev) => appendParticipantId(prev, v));
                    setPickListKey((k) => k + 1);
                  }}
                  className="glass-input h-11 w-full max-w-md rounded-xl px-4 text-sm"
                >
                  <option value="">Elegir nombre…</option>
                  {teamUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <input
              type="text"
              placeholder="O pega IDs separados por coma (id1, id2)"
              value={participantIds}
              onChange={(e) => setParticipantIds(e.target.value)}
              className="glass-input h-11 w-full rounded-xl px-4 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="glass-button glass-button-primary h-11 rounded-xl px-6 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? 'Creando…' : 'Crear actividad'}
          </button>
        </form>
      ) : null}

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Lista
        </h2>
        {loading ? (
          <div className="space-y-3">
            <div className="ui-skeleton h-24 rounded-xl" />
            <div className="ui-skeleton h-24 rounded-xl" />
            <div className="ui-skeleton h-24 rounded-xl" />
          </div>
        ) : (
          <ul className="space-y-3">
            {sorted.length === 0 ? (
              <li className="text-sm text-zinc-500">No hay actividades.</li>
            ) : (
              sorted.map((a) => {
                const canCancel =
                  isAdmin && (a.status === 'DRAFT' || a.status === 'CONFIRMED');
                return (
                  <li
                    key={a.id}
                    className="glass-panel glass-panel-interactive flex flex-col gap-3 rounded-xl px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-zinc-100">{a.title}</span>
                        <span className={activityStatusBadgeClass(a.status)}>
                          {statusLabel(a.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-500">
                        {activityDateOnly(a)} · {a.startTime}–{a.endTime}
                      </p>
                      {a.description ? (
                        <p className="mt-2 text-sm text-zinc-400">{a.description}</p>
                      ) : null}
                      {(a.participants?.length ?? 0) > 0 ? (
                        <p className="mt-2 text-xs text-zinc-500">
                          Participantes:{' '}
                          {(a.participants ?? [])
                            .map((p) => p.user.fullName)
                            .join(', ')}
                        </p>
                      ) : null}
                    </div>
                    {canCancel ? (
                      <button
                        type="button"
                        onClick={() => handleCancel(a.id)}
                        className="shrink-0 self-start rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-all duration-200 hover:border-red-500/40 hover:bg-red-500/20 active:scale-[0.98]"
                      >
                        Cancelar
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
