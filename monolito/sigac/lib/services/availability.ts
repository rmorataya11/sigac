'use client';

import type { Availability, AvailabilityStatus } from '@/lib/types';
import { store } from '@/lib/store';

function nextId(list: Availability[]): string {
  const nums = list.map((a) => parseInt(a.id.replace(/\D/g, '') || '0', 10));
  return 'd' + String((nums.length ? Math.max(...nums) : 0) + 1);
}

export const availabilityService = {
  getAll(): Availability[] {
    return store.getAvailability();
  },

  getByUserId(userId: string): Availability[] {
    return store.getAvailability().filter((a) => a.userId === userId);
  },

  register(
    userId: string,
    userName: string,
    date: string,
    status: AvailabilityStatus
  ): { success: true; item: Availability } | { success: false; error: string } {
    const list = store.getAvailability();
    const exists = list.some((a) => a.userId === userId && a.date === date);
    if (exists) {
      return { success: false, error: 'Ya tienes un registro para esta fecha.' };
    }
    const newItem: Availability = {
      id: nextId(list),
      userId,
      userName,
      date,
      status,
    };
    store.setAvailability([...list, newItem]);
    return { success: true, item: newItem };
  },

  deleteById(id: string): void {
    const list = store.getAvailability().filter((a) => a.id !== id);
    store.setAvailability(list);
  },
};
