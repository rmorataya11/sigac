'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { activitiesService } from '@/lib/services/activities';
import type { Activity } from '@/lib/types';

export default function ActividadesPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>(() => activitiesService.getAll());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [formError, setFormError] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  const refresh = () => setActivities(activitiesService.getAll());

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const t = title.trim();
    const d = description.trim();
    if (!t || !d || !date) {
      setFormError('Título, descripción y fecha son obligatorios.');
      return;
    }
    activitiesService.create(t, d, date);
    setTitle('');
    setDescription('');
    setDate('');
    setFormError('');
    refresh();
  };

  const handleDelete = (id: string) => {
    activitiesService.deleteById(id);
    refresh();
  };

  const sorted = useMemo(
    () => [...activities].sort((a, b) => b.date.localeCompare(a.date)),
    [activities]
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Actividades</h1>

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
            placeholder="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="glass-input w-full rounded-xl px-4 py-3 text-white text-sm resize-none"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="glass-input rounded-xl px-4 h-11 text-white text-sm"
          />
          <button type="submit" className="glass-button px-6 py-2.5 rounded-xl font-medium text-white hover:opacity-95">
            Crear actividad
          </button>
        </form>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Lista de actividades</h2>
        <ul className="space-y-2">
          {sorted.length === 0 ? (
            <li className="text-white/50">No hay actividades.</li>
          ) : (
            sorted.map((a) => (
              <li
                key={a.id}
                className="glass-panel rounded-xl px-4 py-3 flex justify-between items-center gap-4"
              >
                <div className="min-w-0">
                  <span className="font-medium">{a.title}</span>
                  <span className="text-white/50 text-sm ml-2">{a.date}</span>
                  <p className="text-white/70 text-sm truncate">{a.description}</p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-sm text-red-300 hover:bg-red-500/20 transition-colors"
                  >
                    Eliminar
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
