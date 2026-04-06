'use client';

import { useAuth } from '@/context/AuthContext';
import { store } from '@/lib/store';
import { activitiesService } from '@/lib/services/activities';
import { availabilityService } from '@/lib/services/availability';

export default function DashboardPage() {
  const { user } = useAuth();
  const users = store.getUsers();
  const activities = activitiesService.getAll();
  const availability = availabilityService.getAll();

  const totalUsers = users.length;
  const admins = users.filter((u) => u.role === 'ADMIN').length;
  const colaboradores = users.filter((u) => u.role === 'COLABORADOR').length;

  const isAdmin = user?.role === 'ADMIN';

  // Próximas actividades (fecha >= hoy)
  const today = new Date().toISOString().slice(0, 10);
  const upcomingActivities = activities.filter((a) => a.date >= today).sort((a, b) => a.date.localeCompare(b.date));

  // Estado personal (colaborador): sus disponibilidades y próxima actividad
  const myAvailability = user ? availabilityService.getByUserId(user.id) : [];
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
            <ul className="space-y-2">
              {activities.length === 0 ? (
                <li className="text-white/50">No hay actividades.</li>
              ) : (
                activities.map((a) => (
                  <li key={a.id} className="glass-panel rounded-xl px-4 py-3 flex justify-between items-center">
                    <div>
                      <span className="font-medium">{a.title}</span>
                      <span className="text-white/50 text-sm ml-2">{a.date}</span>
                    </div>
                    <p className="text-white/70 text-sm truncate max-w-xs">{a.description}</p>
                  </li>
                ))
              )}
            </ul>
          </section>
        </>
      ) : (
        <>
          <section>
            <h2 className="text-lg font-semibold mb-3">Próximas actividades</h2>
            <ul className="space-y-2">
              {upcomingActivities.length === 0 ? (
                <li className="text-white/50">No hay próximas actividades.</li>
              ) : (
                upcomingActivities.map((a) => (
                  <li key={a.id} className="glass-panel rounded-xl px-4 py-3">
                    <span className="font-medium">{a.title}</span>
                    <span className="text-white/50 text-sm ml-2">{a.date}</span>
                    <p className="text-white/70 text-sm mt-1">{a.description}</p>
                  </li>
                ))
              )}
            </ul>
          </section>
          <section className="glass-panel rounded-2xl p-4">
            <h2 className="text-lg font-semibold mb-2">Estado personal</h2>
            <p className="text-white/70 text-sm">Registros de disponibilidad: {myAvailability.length}</p>
            {nextActivity && (
              <p className="text-white/70 text-sm mt-1">
                Próxima actividad: <strong>{nextActivity.title}</strong> ({nextActivity.date})
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
