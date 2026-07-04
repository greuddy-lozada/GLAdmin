const BASE_URL = 'http://localhost:4000';

interface RequestOptions {
  token?: string;
  body?: unknown;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
}

async function request(path: string, options: RequestOptions = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return res.json();
}

function login(email: string, password: string) {
  return request('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export const apiClient = { request, login };
