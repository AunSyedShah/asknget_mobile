/** One error type for every failed call. `detail` is the server's message (English); screens map codes to copy. */
export class ApiError extends Error {
  readonly status: number;
  readonly errors: unknown[];

  constructor(status: number, message: string, errors: unknown[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

const FALLBACK = 'Something went wrong. Please try again.';

/** Builds an ApiError from the server's ErrorResponse body ({detail, errors?}). */
export function toApiError(status: number, body: unknown): ApiError {
  if (body && typeof body === 'object' && 'detail' in body && typeof body.detail === 'string') {
    const errors = 'errors' in body && Array.isArray(body.errors) ? body.errors : [];
    return new ApiError(status, body.detail, errors);
  }
  return new ApiError(status, FALLBACK);
}

type Result<T> = { data?: T; error?: unknown; response: Response };

/** Returns the data of a successful call, or throws an ApiError. */
export function unwrap<T>(result: Result<T>): T {
  if (!result.response.ok) throw toApiError(result.response.status, result.error);
  return result.data as T;
}

/** True when the error is a network failure (no response from the server). */
export function isNetworkError(error: unknown): boolean {
  return !(error instanceof ApiError);
}
