// Centralized error types and parsing

export class ApiError extends Error {
  constructor(
    public code: string,
    public override message: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      body.code || 'UNKNOWN_ERROR',
      body.message || response.statusText,
      response.status,
      body.details
    );
  }

  // Handle 204 No Content or empty responses
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  // Check content-type before parsing as JSON
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // Return text for non-JSON responses
    const text = await response.text();
    return text as T;
  }

  return response.json();
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
