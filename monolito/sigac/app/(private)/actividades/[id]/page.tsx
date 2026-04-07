'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { activitiesService } from '@/lib/services/activities';
import {
  activityDateOnly,
  type Activity,
  type ActivityStatusApi,
} from '@/lib/types';
import { activityStatusBadgeClass } from '@/lib/ui/activity-status-badge';

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

export default function ActividadDetallePage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError('Identificador no válido.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const row = await activitiesService.get(id);
      setActivity(row);
    } catch (e) {
      setActivity(null);
      setError(
        e instanceof Error ? e.message : 'No se pudo cargar la actividad.',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Detalle de actividad"
        description="Datos obtenidos con GET /activities/:id."
      />

      <p className="mb-6">
        <Link
          href="/actividades"
          className="text-sm font-medium text-violet-400/90 underline-offset-4 transition-colors hover:text-violet-300 hover:underline"
        >
          ← Volver al listado
        </Link>
      </p>

      {loading ? (
        <div className="space-y-3">
          <div className="ui-skeleton h-28 rounded-xl" />
          <div className="ui-skeleton h-20 rounded-xl" />
        </div>
      ) : error ? (
        <div className="ui-alert-error" role="alert">
          {error}
        </div>
      ) : activity ? (
        <article className="glass-panel rounded-2xl p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-100">
              {activity.title}
            </h2>
            <span className={activityStatusBadgeClass(activity.status)}>
              {statusLabel(activity.status)}
            </span>
          </div>
          <p className="mt-3 text-sm text-zinc-500">
            {activityDateOnly(activity)} · {activity.startTime}–{activity.endTime}
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            Quórum mínimo: {activity.minimumQuorum}
          </p>
          {activity.description ? (
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              {activity.description}
            </p>
          ) : null}
          <section className="mt-6 border-t border-white/6 pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Participantes
            </h3>
            {(activity.participants?.length ?? 0) === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">Ninguno asignado.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {(activity.participants ?? []).map((p) => (
                  <li key={p.id} className="text-sm text-zinc-300">
                    <span className="font-medium text-zinc-200">
                      {p.user.fullName}
                    </span>
                    <span className="text-zinc-500"> · {p.user.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </article>
      ) : null}
    </div>
  );
}
