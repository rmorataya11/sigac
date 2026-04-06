'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { store } from '@/lib/store';
import { activitiesService } from '@/lib/services/activities';
import { availabilityService } from '@/lib/services/availability';
import { activityDateOnly, type Activity } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const users = store.getUsers();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [myAvailabilityCount, setMyAvailabilityCount] = useState(0);

  const totalUsers = users.length;
  const admins = users.filter((u) => u.role === 'ADMIN').length;
  const colaboradores = users.filter((u) => u.role === 'COLABORADOR').length;

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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {isAdmin ? (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel rounded-2xl p-4">
              <p className="text-white/60 text-sm">Total usuarios</p>
              <p className="text-2xl font-semibold">{totalUsers}</p>
            </div>
            <div className="glass-panel rounded-2xl p-4">
              <p className="text-white/60 text-sm">Administradores</p>
              <p className="text-2xl font-semibold">{admins}</p>
            </div>
            <div className="glass-panel rounded-2xl p-4">
              <p className="text-white/60 text-sm">Colaboradores</p>
              <p className="text-2xl font-semibold">{colaboradores}</p>
            </div>
          </section>
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
