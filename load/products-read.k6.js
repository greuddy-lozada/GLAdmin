/**
 * Products read — ramp 0→50 VUs, hold 5 min.
 * Run: k6 run load/products-read.k6.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { login, authHeaders, BASE_URL } from './lib/auth.js';

export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  return { token: login() };
}

export default function (data) {
  const page = Math.floor(Math.random() * 5) + 1;
  const res = http.get(
    `${BASE_URL}/products?page=${page}&limit=20`,
    authHeaders(data.token),
  );
  check(res, { 'products 200': (r) => r.status === 200 });
  sleep(0.5);
}
