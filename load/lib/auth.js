import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000/api';
const EMAIL = __ENV.EMAIL || 'admin@cuadra.app';
const PASSWORD = __ENV.PASSWORD || '000000';

/**
 * Login and return accessToken. Fails the VU if login fails.
 */
export function login() {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  const ok = check(res, {
    'login status 200': (r) => r.status === 200,
    'login has accessToken': (r) => {
      try {
        const body = r.json();
        return !!(body?.data?.accessToken || body?.accessToken);
      } catch {
        return false;
      }
    },
  });

  if (!ok) {
    throw new Error(`login failed: ${res.status} ${res.body}`);
  }

  const body = res.json();
  return body?.data?.accessToken || body?.accessToken;
}

export function authHeaders(token) {
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
}

export { BASE_URL };
