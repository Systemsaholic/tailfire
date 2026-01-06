// @tailfire/api-client - Framework-agnostic API client

// Client
export { createApiClient, createMockApiClient } from './client';
export type { ApiClient } from './client';

// Error handling
export { ApiError, parseResponse, isApiError } from './errors';

// Types
export type {
  InquiryPayload,
  ProfilePayload,
  EventPayload,
  ApiResponse,
  TokenProvider,
  ApiClientOptions,
} from './types';

// Domain APIs (for use with createApiClient)
export { createInquiriesApi } from './inquiries';
export { createProfileApi } from './profile';
export { createTrackingApi } from './tracking';

// Standalone mock functions (for development/migration)
export { submitInquiry } from './inquiries';
export { saveProfile } from './profile';
export { trackEvent } from './tracking';
