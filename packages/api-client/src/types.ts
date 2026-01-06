// API request/response types

export interface InquiryPayload {
  tripId?: string;
  tripTitle?: string;
  name: string;
  email: string;
  phone?: string;
  checkIn?: string;
  checkOut?: string;
  travelers?: number;
  notes?: string;
  consultantId?: string;
  sessionId?: string;
}

export interface ProfilePayload {
  name?: string;
  email?: string;
  phone?: string;
  travelers?: number;
  notes?: string;
}

export interface EventPayload {
  event: string;
  properties?: Record<string, unknown>;
  sessionId?: string;
  consultantId?: string;
  timestamp?: string;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export type TokenProvider = () => Promise<string | null>;

export interface ApiClientOptions {
  baseUrl: string;
  getToken?: TokenProvider;
  /** Default timeout in ms (default: 10000) */
  timeout?: number;
  /** Whether to retry on 5xx errors (default: true) */
  retryOn5xx?: boolean;
  /** Max retry attempts (default: 2) */
  maxRetries?: number;
}
