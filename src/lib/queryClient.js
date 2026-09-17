import { QueryClient } from "@tanstack/react-query";

// Aggressive caching so route transitions render instantly from cache
// with no layout shift, while still refreshing quietly in the background.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute - data is "fresh enough" to skip refetch
      gcTime: 30 * 60 * 1000, // 30 minutes - keep unused cache around for instant back/forward nav
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't burn retries on auth/permission errors - they won't resolve themselves.
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 2;
      },
      networkMode: "offlineFirst", // serve cached data immediately even when offline
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});
