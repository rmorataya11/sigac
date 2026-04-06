/**
 * Cliente HTTP preparado para conectar con API NestJS.
 * Por ahora no hace llamadas reales; los servicios mock usan el store.
 * Cuando el backend esté listo: reemplazar en auth/activities/availability
 * las lecturas del store por fetch a baseURL con Authorization: Bearer token.
 */

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? '';

export function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const session = localStorage.getItem('sigac_session');
  if (!session) return {};
  try {
    const { token } = JSON.parse(session) as { token?: string };
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    // ignore
  }
  return {};
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${baseURL}${path}`, { headers: getAuthHeader() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${baseURL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${baseURL}${path}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error(await res.text());
}
