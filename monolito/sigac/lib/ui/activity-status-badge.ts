import type { ActivityStatusApi } from '@/lib/types';

/** Clases de badge por estado (definidas en `globals.css`) */
export function activityStatusBadgeClass(status: ActivityStatusApi): string {
  switch (status) {
    case 'DRAFT':
      return 'ui-badge ui-badge-amber';
    case 'CONFIRMED':
      return 'ui-badge ui-badge-emerald';
    case 'CANCELLED':
      return 'ui-badge ui-badge-rose';
    case 'FINALIZADA':
      return 'ui-badge ui-badge-violet';
    default:
      return 'ui-badge';
  }
}
