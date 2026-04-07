'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/PageHeader';
import { auditService } from '@/lib/services/audit';
import type { AuditActionApi, AuditLogEntry } from '@/lib/types';

function actionLabel(a: AuditActionApi): string {
  switch (a) {
    case 'ACTIVITY_CREATED':
      return 'Actividad creada';
    case 'ACTIVITY_UPDATED':
      return 'Actividad actualizada';
    case 'ACTIVITY_CONFIRMED':
      return 'Actividad confirmada';
    case 'ACTIVITY_CANCELLED':
      return 'Actividad cancelada';
    default:
      return a;
  }
}

function jsonPreview(value: unknown): string {
  if (value === null || value === undefined) {
    return '—';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function AuditoriaPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const rows = await auditService.listLogs();
      setLogs(rows);
    } catch (e) {
      setLogs([]);
      setError(
        e instanceof Error ? e.message : 'No se pudo cargar la auditoría.',
      );
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isAdmin) {
    return (
      <div>
        <PageHeader
          title="Auditoría"
          description="Historial de acciones críticas sobre actividades."
        />
        <p className="text-sm text-zinc-500">
          Solo los administradores pueden consultar los registros de auditoría (GET{' '}
          <code className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-xs text-zinc-300">
            /audit/logs
          </code>
          ).
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Auditoría"
        description="Últimos movimientos: quién hizo qué y estado antes/después (máx. 200 registros en API)."
      />

      {error ? (
        <div className="ui-alert-error mb-6" role="alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          <div className="ui-skeleton h-20 rounded-xl" />
          <div className="ui-skeleton h-20 rounded-xl" />
        </div>
      ) : logs.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay registros de auditoría aún.</p>
      ) : (
        <ul className="space-y-4">
          {logs.map((row) => (
            <li
              key={row.id}
              className="glass-panel rounded-xl px-4 py-4 sm:px-5 sm:py-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-violet-300/95">
                  {actionLabel(row.action)}
                </span>
                <time
                  className="text-xs text-zinc-500"
                  dateTime={row.createdAt}
                >
                  {new Date(row.createdAt).toLocaleString('es', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </time>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {row.user.fullName} ({row.user.email}) · {row.resourceType}{' '}
                <code className="text-zinc-400">{row.resourceId}</code>
              </p>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-zinc-400">
                  Payload antes / después
                </summary>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <pre className="max-h-48 overflow-auto rounded-lg bg-zinc-950/80 p-3 text-[0.65rem] leading-relaxed text-zinc-400">
                    {jsonPreview(row.payloadBefore)}
                  </pre>
                  <pre className="max-h-48 overflow-auto rounded-lg bg-zinc-950/80 p-3 text-[0.65rem] leading-relaxed text-zinc-400">
                    {jsonPreview(row.payloadAfter)}
                  </pre>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
