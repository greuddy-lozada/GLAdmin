import apiClient from '@/lib/api/api-client';
import { env } from '@/config/env';
import type {
  DashboardOverview,
  DashboardStreamEnvelope,
} from '../models/dashboard-overview.model';

export const dashboardService = {
  async getOverview(): Promise<DashboardOverview> {
    const response = await apiClient.get('/dashboard/overview');
    return response.data.data as DashboardOverview;
  },

  /**
   * SSE via fetch + ReadableStream so we can send Authorization.
   * Yields parsed dashboard envelopes (skips malformed lines).
   */
  async *stream(
    signal?: AbortSignal,
  ): AsyncGenerator<DashboardStreamEnvelope> {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const orgId =
      typeof window !== 'undefined' ? localStorage.getItem('currentOrgId') : null;

    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/dashboard/stream`, {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(orgId ? { 'x-organization-id': orgId } : {}),
      },
      signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Dashboard stream failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let eventType = 'message';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split('\n');
      buffer = parts.pop() ?? '';

      for (const rawLine of parts) {
        const line = rawLine.replace(/\r$/, '');
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim();
          continue;
        }
        if (line.startsWith('data:')) {
          const dataStr = line.slice(5).trim();
          try {
            const parsed = JSON.parse(dataStr) as DashboardStreamEnvelope | unknown;
            if (
              parsed &&
              typeof parsed === 'object' &&
              'type' in parsed &&
              'payload' in parsed
            ) {
              yield parsed as DashboardStreamEnvelope;
            } else if (eventType === 'heartbeat') {
              yield {
                type: 'heartbeat',
                payload: parsed,
                at: new Date().toISOString(),
              };
            }
          } catch {
            // skip malformed chunk
          }
          eventType = 'message';
        }
        if (line === '') {
          eventType = 'message';
        }
      }
    }
  },
};
