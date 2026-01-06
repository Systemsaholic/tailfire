// Event tracking API functions

import type { ApiClient } from './client';
import type { EventPayload, ApiResponse } from './types';

export function createTrackingApi(client: ApiClient) {
  return {
    track: (payload: EventPayload): Promise<ApiResponse> =>
      client.post<ApiResponse>('/events', payload),
  };
}

// Standalone function for mock/development use
export async function trackEvent(payload: EventPayload): Promise<ApiResponse> {
  console.log('[mock] trackEvent', payload);
  return { ok: true };
}
