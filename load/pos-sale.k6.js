/**
 * POS sale flow — 20 VUs, 5 min. Targets staging only.
 * Run: k6 run -e BASE_URL=https://staging.api.example/api load/pos-sale.k6.js
 *
 * NOTE: Creates real sales. Never point at production.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { login, authHeaders, BASE_URL } from './lib/auth.js';

export const options = {
  vus: 20,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.02'],
  },
};

export function setup() {
  const token = login();
  const products = http.get(
    `${BASE_URL}/products?page=1&limit=5`,
    authHeaders(token),
  );
  const list = products.json()?.data ?? [];
  const productId = Array.isArray(list) ? list[0]?.id : null;
  return { token, productId };
}

export default function (data) {
  if (!data.productId) {
    sleep(1);
    return;
  }

  const res = http.post(
    `${BASE_URL}/sales`,
    JSON.stringify({
      items: [{ productId: data.productId, quantity: 1 }],
    }),
    authHeaders(data.token),
  );
  check(res, {
    'sale accepted or validated': (r) =>
      r.status === 201 || r.status === 200 || r.status === 400,
  });
  sleep(1);
}
