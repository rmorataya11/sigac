'use client';

import type { Availability } from '@/lib/types';
import { apiDelete, apiGet, apiPost } from '@/lib/api-client';

export type CreateAvailabilityInput = {
  date: string;
  startTime: string;
  endTime: string;
};

export const availabilityService = {
  async listMine(): Promise<Availability[]> {
    return apiGet<Availability[]>('/availability/me');
  },

  async listGlobal(): Promise<Availability[]> {
    return apiGet<Availability[]>('/availability/global');
  },

  async create(input: CreateAvailabilityInput): Promise<Availability> {
    return apiPost<Availability>('/availability', {
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
    });
  },

  async remove(id: string): Promise<void> {
    await apiDelete(`/availability/${id}`);
  },
};
