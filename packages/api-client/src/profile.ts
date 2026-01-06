// Profile API functions

import type { ApiClient } from './client';
import type { ProfilePayload, ApiResponse } from './types';

export function createProfileApi(client: ApiClient) {
  return {
    save: (payload: ProfilePayload): Promise<ApiResponse> =>
      client.post<ApiResponse>('/profile', payload),

    get: (): Promise<ProfilePayload> =>
      client.get<ProfilePayload>('/profile'),
  };
}

// Standalone function for mock/development use
export async function saveProfile(payload: ProfilePayload): Promise<ApiResponse> {
  console.log('[mock] saveProfile', payload);
  return { ok: true };
}
