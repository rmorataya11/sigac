'use client';

import type { Activity } from '@/lib/types';
import { store } from '@/lib/store';

function nextId(list: Activity[]): string {
  const nums = list.map((a) => parseInt(a.id.replace(/\D/g, '') || '0', 10));
  return 'a' + String((nums.length ? Math.max(...nums) : 0) + 1);
}

export const activitiesService = {
  getAll(): Activity[] {
    return store.getActivities();
  },

  create(title: string, description: string, date: string): Activity {
    const list = store.getActivities();
    const newActivity: Activity = {
      id: nextId(list),
      title: title.trim(),
      description: description.trim(),
      date,
    };
    store.setActivities([...list, newActivity]);
    return newActivity;
  },

  deleteById(id: string): void {
    const list = store.getActivities().filter((a) => a.id !== id);
    store.setActivities(list);
  },
};
