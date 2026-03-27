/**
 * API Client with React Query Integration
 * Provides type-safe API calls with caching, retry, and error handling
 */

import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from "@tanstack/react-query"
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
    queryFn: () => fetchRegionalStats(district),
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
    queryFn: () => fetchFarms(district, limit),
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
    queryFn: () => fetchAdvisoryTrend(days),
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
    queryFn: () => fetchStoredForecast(farmId, days),
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
    queryFn: () => fetchAdvisories(limit, skip),
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
 */
export function useRegisterFarmer(
  options?: Omit<UseMutationOptions<{ id: number; name: string; phone: string }, Error, FarmerRegisterPayload>, "mutationFn">
) {
  return useMutation({
    mutationFn: (payload: FarmerRegisterPayload) => registerFarmer(payload),
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
