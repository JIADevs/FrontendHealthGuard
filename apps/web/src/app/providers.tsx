"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isApiError } from "@helu/api";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            retry: (count, error) => {
              if (isApiError(error) && error.status >= 400 && error.status < 500)
                return false;
              return count < 2;
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            onError: (error) => {
              if (isApiError(error)) {
                console.error(`[API Error] ${error.code}: ${error.message}`);
              }
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
