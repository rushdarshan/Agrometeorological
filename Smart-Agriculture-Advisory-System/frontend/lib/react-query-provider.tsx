"use client"

import { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

/**
 * Exponential backoff delay: 1000ms * 2^(attempt-1)
 * Attempt 1: 1000ms (1s)
 * Attempt 2: 2000ms (2s)
 * Attempt 3: 4000ms (4s)
 */
function getExponentialBackoffDelay(attemptIndex: number): number {
  return Math.min(1000 * Math.pow(2, attemptIndex), 30000) // Cap at 30s
}

// Create a client for the app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && error.message.includes("HTTP 4")) {
          return false
        }
        // Retry up to 3 times on other errors (5xx, network, timeout)
        return failureCount < 3
      },
      retryDelay: getExponentialBackoffDelay,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: getExponentialBackoffDelay,
    },
  },
})

export interface ReactQueryProviderProps {
  children: ReactNode
}

/**
 * React Query Provider wrapper
 * Handles caching, fetching, and synchronization
 */
export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

export { queryClient }
