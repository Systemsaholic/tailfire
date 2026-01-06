// Inquiry API functions

import type { ApiClient } from './client';
import type { InquiryPayload, ApiResponse } from './types';

export function createInquiriesApi(client: ApiClient) {
  return {
    submit: (payload: InquiryPayload): Promise<ApiResponse> =>
      client.post<ApiResponse>('/inquiries', payload),
  };
}

// Standalone function for mock/development use
export async function submitInquiry(payload: InquiryPayload): Promise<ApiResponse> {
  console.log('[mock] submitInquiry', payload);
  return { ok: true };
}
