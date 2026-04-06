'use client';

import type { Activity } from '@/lib/types';
import { apiGet, apiPatch, apiPost } from '@/lib/api-client';

export type CreateActivityInput = {
  title: string;
  description?: string;
  activityDate: string;
  startTime: string;
  endTime: string;
  minimumQuorum: number;
  participantUserIds?: string[];
};

/** Respuesta de GET /activities/dashboard/summary (solo ADMIN). */
export type ActivitiesDashboardSummary = {
  total: number;
  byStatus: Record<string, number>;
  upcomingConfirmed: number;
};

export const activitiesService = {
  async list(): Promise<Activity[]> {
    return apiGet<Activity[]>('/activities');
  },

  async getDashboardSummary(): Promise<ActivitiesDashboardSummary> {
    return apiGet<ActivitiesDashboardSummary>('/activities/dashboard/summary');
  },

  async create(input: CreateActivityInput): Promise<Activity> {
    return apiPost<Activity>('/activities', {
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      activityDate: input.activityDate,
      startTime: input.startTime,
      endTime: input.endTime,
      minimumQuorum: input.minimumQuorum,
      participantUserIds:
        input.participantUserIds && input.participantUserIds.length > 0
          ? input.participantUserIds
          : undefined,
    });
  },

  async cancel(id: string): Promise<Activity> {
    return apiPatch<Activity>(`/activities/${id}/cancel`, {});
  },
};
