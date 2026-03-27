/**
 * API Client with React Query Integration
 * Provides type-safe API calls with caching, retry, and error handling
 */

import { useQuery, useMutation, UseQueryOptions, UseMutationOptions, useQueryClient } from "@tanstack/react-query"
import {
  RegionalStats,
  Farm,
  FarmTimeline,
  Advisory,
  AdvisoryTrend,
  WeatherForecast,
  FarmerRegisterPayload,
  HealthCheckResponse,
  PaginatedResponse,
} from "./types"
import { API_CONFIG, QUERY_KEYS, TIMEOUTS } from "./constants"
import { DEMO_STATS, DEMO_FARMS, DEMO_ADVISORIES, DEMO_WEATHER } from "./demo-data"

// Check if demo mode is enabled
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

// ── Base Fetch Function ──────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
  timeoutMs: number = TIMEOUTS.apiRequest
): Promise<T> {
  const url = `${API_CONFIG.baseUrl}${path}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `HTTP ${response.status}`)
    }

    return response.json()
  } catch (error) {
    // In demo mode, return demo data as fallback
    if (DEMO_MODE) {
      console.warn('📊 Using demo data (API unavailable)')
      // Return empty object which will be handled by component logic
      // Components will check for demo mode and use demo data directly
      return {} as T
    }
    
    // Distinguish timeout errors from other fetch errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

// ── Dashboard API ────────────────────────────────────────────────────────

export async function fetchRegionalStats(district: string): Promise<RegionalStats> {
  return apiFetch<RegionalStats>(
    `/dashboard/regional-stats?district=${encodeURIComponent(district)}`
  )
}

export async function fetchFarms(
  district: string,
  limit: number = 10
): Promise<Farm[]> {
  return apiFetch<Farm[]>(
    `/dashboard/farms?district=${encodeURIComponent(district)}&limit=${limit}`
  )
}

export async function fetchFarmTimeline(
  farmId: number,
  days: number = 30
): Promise<FarmTimeline> {
  return apiFetch<FarmTimeline>(`/dashboard/farm/${farmId}/timeline?days=${days}`)
}

export async function fetchAdvisoryTrend(days: number = 14): Promise<AdvisoryTrend> {
  return apiFetch<AdvisoryTrend>(`/dashboard/advisory-trend?days=${days}`)
}

// ── Weather API ──────────────────────────────────────────────────────────

export async function fetchFarmWeather(
  farmId: number
): Promise<{ summary: Record<string, number | string>; daily: WeatherForecast[] }> {
  return apiFetch(`/weather/farm/${farmId}`)
}

export async function fetchStoredForecast(
  farmId: number,
  days: number = 7
): Promise<{ farm_id: number; records: WeatherForecast[] }> {
  return apiFetch(`/weather/farm/${farmId}/forecast?days=${days}`)
}

// ── Advisory API ─────────────────────────────────────────────────────────

export async function fetchAdvisories(
  limit: number = 20,
  skip: number = 0
): Promise<Advisory[]> {
  return apiFetch<Advisory[]>(`/advisories/list?limit=${limit}&skip=${skip}`)
}

export async function fetchAdvisory(id: number): Promise<Advisory> {
  return apiFetch<Advisory>(`/advisories/${id}`)
}

// ── Auth API ─────────────────────────────────────────────────────────────

export async function registerFarmer(
  payload: FarmerRegisterPayload
): Promise<{ id: number; name: string; phone: string }> {
  return apiFetch(`/auth/register`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// ── Health Check ─────────────────────────────────────────────────────────

export async function fetchHealth(): Promise<HealthCheckResponse> {
  return apiFetch<HealthCheckResponse>(`/health`.replace("/api", ""))
}

// ── React Query Hooks ────────────────────────────────────────────────────

/**
 * Fetch regional statistics
 */
export function useDashboardStats(
  district: string,
  options?: Omit<UseQueryOptions<RegionalStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: QUERY_KEYS.regionalStats(district),
    queryFn: async () => {
      if (DEMO_MODE) {
        console.info('📊 Loading demo statistics')
        return DEMO_STATS
      }
      return fetchRegionalStats(district)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: API_CONFIG.retryAttempts,
    ...options,
  })
}

/**
 * Fetch farms list
 */
export function useFarms(
  district: string,
  limit: number = 10,
  options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: QUERY_KEYS.farms(district, limit),
    queryFn: async () => {
      if (DEMO_MODE) {
        console.info('🌾 Loading demo farms')
        return DEMO_FARMS
      }
      return fetchFarms(district, limit)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: API_CONFIG.retryAttempts,
    ...options,
  })
}

/**
 * Fetch farm timeline (advisories + weather)
 */
export function useFarmTimeline(
  farmId: number,
  days: number = 30,
  options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: QUERY_KEYS.farmTimeline(farmId, days),
    queryFn: () => fetchFarmTimeline(farmId, days),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: API_CONFIG.retryAttempts,
    ...options,
  })
}

/**
 * Fetch advisory trend
 */
export function useAdvisoryTrend(
  days: number = 14,
  options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: QUERY_KEYS.advisoryTrend(days),
    queryFn: async () => {
      if (DEMO_MODE) {
        console.info('📋 Loading demo advisory trend')
        // Calculate trend from demo advisories
        return { advisory_count: DEMO_ADVISORIES.length, trend_percentage: 12.5 }
      }
      return fetchAdvisoryTrend(days)
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: API_CONFIG.retryAttempts,
    ...options,
  })
}

/**
 * Fetch farm weather
 */
export function useFarmWeather(
  farmId: number,
  options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: QUERY_KEYS.farmWeather(farmId),
    queryFn: () => fetchFarmWeather(farmId),
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    ...options,
  })
}

/**
 * Fetch stored weather forecast
 */
export function useForecast(
  farmId: number,
  days: number = 7,
  options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: QUERY_KEYS.forecast(farmId, days),
    queryFn: async () => {
      if (DEMO_MODE) {
        console.info('🌤️ Loading demo weather forecast')
        return { farm_id: farmId, records: DEMO_WEATHER.slice(0, days) }
      }
      return fetchStoredForecast(farmId, days)
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    ...options,
  })
}

/**
 * Fetch advisories list
 */
export function useAdvisories(
  limit: number = 20,
  skip: number = 0,
  options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: QUERY_KEYS.advisories(limit, skip),
    queryFn: async () => {
      if (DEMO_MODE) {
        console.info('📢 Loading demo advisories')
        return DEMO_ADVISORIES.slice(skip, skip + limit)
      }
      return fetchAdvisories(limit, skip)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: API_CONFIG.retryAttempts,
    ...options,
  })
}

/**
 * Fetch single advisory
 */
export function useAdvisory(
  id: number,
  options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: QUERY_KEYS.advisory(id),
    queryFn: () => fetchAdvisory(id),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: API_CONFIG.retryAttempts,
    ...options,
  })
}

/**
 * Register a new farmer (mutation)
 * Invalidates dashboard stats and farms list on success
 */
export function useRegisterFarmer(
  options?: Omit<UseMutationOptions<{ id: number; name: string; phone: string }, Error, FarmerRegisterPayload>, "mutationFn">
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: FarmerRegisterPayload) => registerFarmer(payload),
    onSuccess: async (data, variables) => {
      // Invalidate relevant queries when registration succeeds
      // This ensures fresh data is refetched without stale cache
      const district = variables.district || "all"
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.farms(district, 20) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.regionalStats(district) }),
      ])
    },
    ...options,
  })
}

/**
 * Health check
 */
export function useHealthCheck(
  options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: QUERY_KEYS.health(),
    queryFn: () => fetchHealth(),
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
    ...options,
  })
}

// ── Export for backward compatibility ────────────────────────────────────

export { apiFetch }
