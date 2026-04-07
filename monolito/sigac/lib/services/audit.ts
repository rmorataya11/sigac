'use client';

import type { AuditLogEntry } from '@/lib/types';
import { apiGet } from '@/lib/api-client';

export const auditService = {
  /** GET /audit/logs — solo ADMIN (403 si no). */
  async listLogs(): Promise<AuditLogEntry[]> {
    return apiGet<AuditLogEntry[]>('/audit/logs');
  },
};
