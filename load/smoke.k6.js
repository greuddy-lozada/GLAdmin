/**
 * Smoke — 1 VU, 1 min. Sanity-check health + login + products list.
 * Run: k6 run load/smoke.k6.js
 * Env: BASE_URL, EMAIL, PASSWORD
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { login, authHeaders, BASE_URL } from './lib/auth.js';

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  const health = http.get(`${BASE_URL}/health`);
  check(health, { 'health ok': (r) => r.status === 200 });

  const token = login();
  const products = http.get(`${BASE_URL}/products`, authHeaders(token));
  check(products, { 'products 200': (r) => r.status === 200 });

  sleep(1);
}
