'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  activitiesService,
  type ActivitiesDashboardSummary,
} from '@/lib/services/activities';
import { availabilityService } from '@/lib/services/availability';
import { activityDateOnly, type Activity } from '@/lib/types';
import PageHeader from '@/components/PageHeader';
import { activityStatusBadgeClass } from '@/lib/ui/activity-status-badge';

function statusLabel(key: string): string {
  switch (key) {
    case 'DRAFT':
      return 'Borrador';
    case 'CONFIRMED':
      return 'Confirmada';
    case 'CANCELLED':
      return 'Cancelada';
    case 'FINALIZADA':
      return 'Finalizada';
    default:
      return key;
  }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [myAvailabilityCount, setMyAvailabilityCount] = useState(0);
  const [summary, setSummary] = useState<ActivitiesDashboardSummary | null>(
    null,
  );
  const [summaryLoading, setSummaryLoading] = useState(true);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await activitiesService.list();
        if (!cancelled) setActivities(list);
      } catch {
        if (!cancelled) setActivities([]);
      } finally {
        if (!cancelled) setActivitiesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setSummary(null);
      setSummaryLoading(false);
      return;
    }
    let cancelled = false;
    setSummaryLoading(true);
    activitiesService
      .getDashboardSummary()
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!user || user.role === 'ADMIN') {
      setMyAvailabilityCount(0);
      return;
    }
    let cancelled = false;
    availabilityService
      .listMine()
      .then((list) => {
        if (!cancelled) setMyAvailabilityCount(list.length);
      })
      .catch(() => {
        if (!cancelled) setMyAvailabilityCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const today = new Date().toISOString().slice(0, 10);
  const upcomingActivities = useMemo(() => {
    return activities
      .filter((a) => {
        const d = activityDateOnly(a);
        if (d < today) return false;
        if (a.status === 'CANCELLED' || a.status === 'FINALIZADA') return false;
        return true;
      })
      .sort((a, b) => activityDateOnly(a).localeCompare(activityDateOnly(b)));
  }, [activities, today]);

  const nextActivity = upcomingActivities[0];

  const byStatusEntries = summary
    ? Object.entries(summary.byStatus).filter(([, n]) => n > 0)
    : [];

  return (
    <div>
      <PageHeader
        title="Panel"
        description={
          isAdmin
            ? 'Resumen de actividades y estado del sistema.'
            : 'Tu próxima agenda y disponibilidad registrada.'
        }
      />

      {isAdmin ? (
        <>
          <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {summaryLoading ? (
              <>
                <div className="ui-skeleton h-24 rounded-2xl" />
                <div className="ui-skeleton h-24 rounded-2xl" />
                <div className="ui-skeleton h-24 rounded-2xl" />
              </>
            ) : (
              <>
                <div className="glass-panel rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-0.5">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Total
                  </p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">
                    {summary?.total ?? '—'}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">Actividades</p>
                </div>
                <div className="glass-panel rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-0.5">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Próximas confirmadas
                  </p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-emerald-300/95">
                    {summary?.upcomingConfirmed ?? '—'}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Desde hoy (UTC)
                  </p>
                </div>
                <div className="glass-panel rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-0.5">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    En borrador
                  </p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">
                    {summary?.byStatus?.DRAFT ?? '—'}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">Pendientes</p>
                </div>
              </>
            )}
          </section>

          {!summaryLoading && summary && byStatusEntries.length > 0 ? (
            <p className="mb-6 text-sm text-zinc-500">
              Por estado:{' '}
              {byStatusEntries.map(([k, v], i) => (
                <span key={k}>
                  {i > 0 ? ' · ' : ''}
                  {statusLabel(k)}: {v}
                </span>
              ))}
            </p>
          ) : null}

          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Actividades registradas
            </h2>
            {activitiesLoading ? (
              <div className="space-y-3">
                <div className="ui-skeleton h-16 rounded-xl" />
                <div className="ui-skeleton h-16 rounded-xl" />
                <div className="ui-skeleton h-16 rounded-xl" />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-zinc-500">No hay actividades aún.</p>
            ) : (
              <ul className="space-y-3">
                {activities.map((a) => (
                  <li
                    key={a.id}
                    className="glass-panel glass-panel-interactive rounded-xl px-5 py-4"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium text-zinc-100">{a.title}</span>
                      <span className={activityStatusBadgeClass(a.status)}>
                        {statusLabel(a.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      {activityDateOnly(a)} · {a.startTime}–{a.endTime}
                    </p>
                    {a.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
                        {a.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Próximas actividades
            </h2>
            {activitiesLoading ? (
              <div className="space-y-3">
                <div className="ui-skeleton h-20 rounded-xl" />
                <div className="ui-skeleton h-20 rounded-xl" />
              </div>
            ) : upcomingActivities.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No hay actividades próximas en el calendario.
              </p>
            ) : (
              <ul className="space-y-3">
                {upcomingActivities.map((a) => (
                  <li
                    key={a.id}
                    className="glass-panel glass-panel-interactive rounded-xl px-5 py-4"
                  >
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
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="glass-panel rounded-2xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Tu resumen
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              Franjas de disponibilidad registradas:{' '}
              <span className="font-medium text-zinc-200">{myAvailabilityCount}</span>
            </p>
            {nextActivity ? (
              <p className="mt-3 text-sm text-zinc-400">
                Siguiente en agenda:{' '}
                <span className="font-medium text-cyan-300/95">{nextActivity.title}</span>{' '}
                <span className="text-zinc-500">
                  ({activityDateOnly(nextActivity)})
                </span>
              </p>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
