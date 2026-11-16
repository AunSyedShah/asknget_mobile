import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './errors';

/**
 * Server state. Client errors (4xx) are not retried: they will not change on
 * their own. Network and server errors retry twice.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: { retry: false },
    },
  });
}
