import { useAuthStore } from '@/stores/authStore';

const BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchApi<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    ...(opts.body != null ? { 'Content-Type': 'application/json' } : {}),
    ...(opts.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE}${path}`;

  const res = await fetch(url, {
    ...opts,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.message || `Request failed: ${res.status}`) as Error & {
      status: number;
    };
    err.status = res.status;
    throw err;
  }

  return res.json();
}
