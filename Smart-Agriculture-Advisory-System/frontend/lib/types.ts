/**
 * Shared TypeScript Types
 * Centralized type definitions for the entire frontend
 * Ensure consistency across all components and API calls
 */

// ── User & Farm Types ────────────────────────────────────────────────────

export interface Farmer {
  id: number
  name: string
  phone: string
  email?: string
  village: string
  district: string
  state: string
  latitude: number
  longitude: number
  preferred_language?: string
  consented_advisory: boolean
  consented_data_use: boolean
  created_at?: string
  updated_at?: string
}

export interface Farm {
  id: number
  farm_name: string
  farmer_id?: number
  farmer_name?: string
  farmer_phone?: string
  crop_name: string
  area_hectares: number
  village: string
  district: string
  state?: string
  latitude?: number
  longitude?: number
  sowing_date?: string
  last_advisory?: Advisory | null
  last_weather?: Weather | null
}

// ── Dashboard Types ──────────────────────────────────────────────────────

export interface RegionalStats {
  total_farms: number
  total_farmers: number
  active_advisories_count: number
  avg_engagement_rate: number
  advisory_type_distribution: Record<string, number>
  sms_delivery_rate: number
  district?: string
}

export type FarmSummary = Farm

// ── Weather Types ────────────────────────────────────────────────────────

export interface Weather {
  date?: string
  temp_min?: number
  temp_max?: number
  temp_mean?: number
  humidity?: number
  rainfall?: number
  wind_speed?: number
  source?: string
}

export interface WeatherForecast extends Weather {
  date: string
}

export interface FarmWeather {
  farm_id: number
  summary: Record<string, number | string>
  daily: WeatherForecast[]
}

// ── Advisory Types ───────────────────────────────────────────────────────

export type AdvisorySeverity = "low" | "medium" | "high"
export type AdvisoryType = "irrigation" | "pest" | "disease" | "harvest" | "weather" | "soil" | string

export interface Advisory {
  id: number
  farm_id: number
  advisory_type?: AdvisoryType | string
  type?: string
  severity: AdvisorySeverity
  confidence: number
  title?: string
  message: string
  generated_by?: string
  generated_at?: string
}

export interface AdvisoryTrend {
  trend: { date: string; count: number }[]
  days: number
}

export interface FarmTimeline {
  farm_id: number
  farm_name: string
  crop_name: string
  farmer_name?: string
  advisories: Advisory[]
  weather: WeatherForecast[]
  messages: Message[]
}

export interface Message {
  id: number
  farm_id?: number
  channel: "sms" | "email" | "push"
  content: string
  status: "sent" | "failed" | "pending"
  sent_at?: string
}

// ── Form Types ───────────────────────────────────────────────────────────

export interface FarmerRegisterPayload {
  phone: string
  name: string
  village: string
  district: string
  state: string
  latitude: number
  longitude: number
  crop_name: string
  sowing_date?: string
  area_hectares?: number
  consented_advisory: boolean
  consented_data_use: boolean
  preferred_language?: string
}

export interface FarmerProfileUpdate extends Partial<FarmerRegisterPayload> {
  id: number
}

// ── API Response Types ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  status: "success" | "error"
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy"
  ml_model_ready: boolean
  database_ready: boolean
  redis_ready: boolean
  weather_api?: boolean
  timestamp?: string
}

// ── UI State Types ───────────────────────────────────────────────────────

export type ViewType = "dashboard" | "farm" | "advisories" | "profile"

export interface LoadingState {
  isLoading: boolean
  error: Error | null
  retryCount: number
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

// ── Filter & Sort Types ──────────────────────────────────────────────────

export interface FarmFilters {
  district?: string
  crop_name?: string
  minArea?: number
  maxArea?: number
  searchTerm?: string
}

export interface AdvisoryFilters {
  severity?: AdvisorySeverity
  advisoryType?: AdvisoryType
  crop?: string
  startDate?: string
  endDate?: string
  status?: "new" | "read" | "implemented"
  sortBy?: "newest" | "oldest" | "severity"
  searchTerm?: string
}

export type SortOrder = "asc" | "desc"

export interface SortConfig {
  field: string
  order: SortOrder
}

// ── Notification Types ───────────────────────────────────────────────────

export type NotificationType = "success" | "error" | "warning" | "info"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// ── Theme Types ──────────────────────────────────────────────────────────

export type ThemeMode = "light" | "dark" | "system"

export interface UserPreferences {
  theme: ThemeMode
  language: string
  district: string
  notifications_enabled: boolean
  email_notifications: boolean
  sms_notifications: boolean
}
