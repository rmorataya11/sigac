'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  activitiesService,
  type ActivitiesDashboardSummary,
} from '@/lib/services/activities';
import { availabilityService } from '@/lib/services/availability';
import { activityDateOnly, type Activity } from '@/lib/types';

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
  const [summary, setSummary] = useState<ActivitiesDashboardSummary | null>(null);
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
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {isAdmin ? (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel rounded-2xl p-4">
              <p className="text-white/60 text-sm">Total actividades</p>
              <p className="text-2xl font-semibold">
                {summaryLoading ? '…' : (summary?.total ?? '—')}
              </p>
            </div>
            <div className="glass-panel rounded-2xl p-4">
              <p className="text-white/60 text-sm">Próximas confirmadas</p>
              <p className="text-2xl font-semibold">
                {summaryLoading ? '…' : (summary?.upcomingConfirmed ?? '—')}
              </p>
              <p className="text-white/45 text-xs mt-1">Desde hoy (UTC), estado confirmada</p>
            </div>
            <div className="glass-panel rounded-2xl p-4">
              <p className="text-white/60 text-sm">En borrador</p>
              <p className="text-2xl font-semibold">
                {summaryLoading
                  ? '…'
                  : (summary?.byStatus?.DRAFT ?? '—')}
              </p>
            </div>
          </section>
          {!summaryLoading && summary && byStatusEntries.length > 0 && (
            <p className="text-white/55 text-sm">
              Por estado:{' '}
              {byStatusEntries.map(([k, v], i) => (
                <span key={k}>
                  {i > 0 ? ' · ' : ''}
                  {statusLabel(k)}: {v}
                </span>
              ))}
            </p>
          )}
          <section>
            <h2 className="text-lg font-semibold mb-3">Actividades registradas</h2>
            {activitiesLoading ? (
              <p className="text-white/50">Cargando actividades…</p>
            ) : (
            <ul className="space-y-2">
              {activities.length === 0 ? (
                <li className="text-white/50">No hay actividades.</li>
              ) : (
                activities.map((a) => (
                  <li key={a.id} className="glass-panel rounded-xl px-4 py-3 flex justify-between items-center gap-4">
                    <div>
                      <span className="font-medium">{a.title}</span>
                      <span className="text-white/50 text-sm ml-2">
                        {activityDateOnly(a)} · {a.startTime}–{a.endTime}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm truncate max-w-xs">{a.description ?? '—'}</p>
                  </li>
                ))
              )}
            </ul>
            )}
          </section>
        </>
      ) : (
        <>
          <section>
            <h2 className="text-lg font-semibold mb-3">Próximas actividades</h2>
            {activitiesLoading ? (
              <p className="text-white/50">Cargando…</p>
            ) : (
            <ul className="space-y-2">
              {upcomingActivities.length === 0 ? (
                <li className="text-white/50">No hay próximas actividades.</li>
              ) : (
                upcomingActivities.map((a) => (
                  <li key={a.id} className="glass-panel rounded-xl px-4 py-3">
                    <span className="font-medium">{a.title}</span>
                    <span className="text-white/50 text-sm ml-2">
                      {activityDateOnly(a)} · {a.startTime}–{a.endTime}
                    </span>
                    <p className="text-white/70 text-sm mt-1">{a.description ?? '—'}</p>
                  </li>
                ))
              )}
            </ul>
            )}
          </section>
          <section className="glass-panel rounded-2xl p-4">
            <h2 className="text-lg font-semibold mb-2">Estado personal</h2>
            <p className="text-white/70 text-sm">Registros de disponibilidad: {myAvailabilityCount}</p>
            {nextActivity && (
              <p className="text-white/70 text-sm mt-1">
                Próxima actividad: <strong>{nextActivity.title}</strong> ({activityDateOnly(nextActivity)})
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
