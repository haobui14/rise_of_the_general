import { useAuthStore } from '@/stores/authStore';

const BASE = import.meta.env.VITE_API_URL || '/api';

// Debug: log the API base URL
console.log('[API] Base URL:', BASE);
console.log('[API] VITE_API_URL:', import.meta.env.VITE_API_URL);

export async function fetchApi<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE}${path}`;
  console.log(`[API] ${opts.method || 'GET'} ${url}`);

  const res = await fetch(url, {
    ...opts,
    headers,
  });

  if (!res.ok) {
    console.error(`[API] ${res.status} ${res.statusText} for ${url}`);
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }

  return res.json();
}
