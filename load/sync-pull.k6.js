/**
 * Sync pull — 30 VUs, offline-first critical path.
 * Run: k6 run load/sync-pull.k6.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { login, authHeaders, BASE_URL } from './lib/auth.js';

export const options = {
  vus: 30,
  duration: '3m',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  return { token: login() };
}

export default function (data) {
  const res = http.get(`${BASE_URL}/sync/pull`, authHeaders(data.token));
  check(res, { 'sync pull 200': (r) => r.status === 200 });
  sleep(0.3);
}
