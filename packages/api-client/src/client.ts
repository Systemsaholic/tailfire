// Framework-agnostic API client with token provider pattern

import type { ApiClientOptions } from './types';
import { ApiError, parseResponse } from './errors';

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_MAX_RETRIES = 2;

export interface ApiClient {
  fetch<T>(path: string, init?: RequestInit): Promise<T>;
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  put<T>(path: string, body: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const {
    baseUrl,
    getToken,
    timeout = DEFAULT_TIMEOUT,
    retryOn5xx = true,
    maxRetries = DEFAULT_MAX_RETRIES,
  } = options;

  async function apiFetch<T>(path: string, init?: RequestInit, attempt = 0): Promise<T> {
    const token = getToken ? await getToken() : null;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Only set Content-Type for JSON bodies (not FormData, GET requests, etc.)
    const isJsonBody = init?.body && typeof init.body === 'string';
    const hasContentType = init?.headers &&
      (init.headers instanceof Headers
        ? init.headers.has('Content-Type')
        : 'Content-Type' in init.headers || 'content-type' in init.headers);

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          ...(isJsonBody && !hasContentType && { 'Content-Type': 'application/json' }),
          ...init?.headers,
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      clearTimeout(timeoutId);

      // Retry on 5xx errors if enabled (not on 4xx - those are client errors)
      if (retryOn5xx && response.status >= 500 && attempt < maxRetries) {
        // Exponential backoff: 100ms, 200ms, 400ms...
        await new Promise((r) => setTimeout(r, 100 * Math.pow(2, attempt)));
        return apiFetch<T>(path, init, attempt + 1);
      }

      return parseResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('TIMEOUT', `Request timed out after ${timeout}ms`, 408);
      }

      throw error;
    }
  }

  return {
    fetch: apiFetch,
    get: <T>(path: string) => apiFetch<T>(path, { method: 'GET' }),
    post: <T>(path: string, body: unknown) =>
      apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(path: string, body: unknown) =>
      apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
    delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
  };
}

// Default mock client for development (logs to console)
export function createMockApiClient(): ApiClient {
  const mockFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
    console.log(`[mock] ${init?.method || 'GET'} ${path}`, init?.body ? JSON.parse(init.body as string) : undefined);
    return { ok: true } as T;
  };

  return {
    fetch: mockFetch,
    get: <T>(path: string) => mockFetch<T>(path, { method: 'GET' }),
    post: <T>(path: string, body: unknown) =>
      mockFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(path: string, body: unknown) =>
      mockFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
    delete: <T>(path: string) => mockFetch<T>(path, { method: 'DELETE' }),
  };
}
