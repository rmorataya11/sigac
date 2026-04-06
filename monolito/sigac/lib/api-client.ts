/**
 * Cliente HTTP para la API NestJS (baseURL = NEXT_PUBLIC_API_URL).
 */

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? '';

async function readErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text) as { message?: string | string[] };
    if (Array.isArray(j.message)) return j.message.join('. ');
    if (typeof j.message === 'string') return j.message;
  } catch {
    // ignore
  }
  return text || `Error ${res.status}`;
}

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
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${baseURL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json();
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${baseURL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json();
}

/** POST sin JWT (login, registro). */
export async function apiPostPublic<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${baseURL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json();
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${baseURL}${path}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
}
