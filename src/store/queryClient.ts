import { QueryClient } from '@tanstack/react-query';

// Single shared TanStack Query client. Data-fetching hooks migrate onto this
// incrementally (replacing the hand-rolled loading/error/refetch hooks).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Mock services are cheap and deterministic; keep data warm and avoid
      // aggressive refetching that the old hooks never did.
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
