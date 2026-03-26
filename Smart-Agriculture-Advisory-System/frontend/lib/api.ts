// API client — connects Next.js frontend to the FastAPI backend

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface RegionalStats {
  total_farms: number
  total_farmers: number
  active_advisories_count: number
  avg_engagement_rate: number
  advisory_type_distribution: Record<string, number>
  sms_delivery_rate: number
  district?: string
}

export interface FarmSummary {
  id: number
  farm_name: string
  crop_name: string
  area_hectares: number
  village: string
  district: string
  farmer_name: string
  farmer_phone: string
  lat?: number
  lon?: number
  last_advisory?: {
    id: number
    advisory_type: string
    message: string
    severity: string
    confidence: number
    generated_at: string
  } | null
  last_weather?: {
    temp_mean?: number
    humidity?: number
    rainfall?: number
    source?: string
  } | null
}

export interface WeatherForecast {
  date: string
  temp_min?: number
  temp_max?: number
  temp_mean?: number
  humidity?: number
  rainfall?: number
  wind_speed?: number
  source?: string
}

export interface FarmTimeline {
  farm_id: number
  farm_name: string
  crop_name: string
  farmer_name?: string
  advisories: {
    id: number
    type: string
    message: string
    severity: string
    confidence: number
    generated_by: string
    generated_at: string
  }[]
  weather: WeatherForecast[]
  messages: { id: number; channel: string; content: string; status: string; sent_at?: string }[]
}

export interface Advisory {
  id: number
  farm_id: number
  advisory_type: string
  severity: string
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

// ── API functions ─────────────────────────────────────────────────────────────

/** Regional stats (total farms, farmers, advisory counts) */
export const getRegionalStats = (district = "Kaira") =>
  apiFetch<RegionalStats>(`/dashboard/regional-stats?district=${encodeURIComponent(district)}`)

/** List of farms with last advisory & weather */
export const getFarms = (district = "Kaira", limit = 10) =>
  apiFetch<FarmSummary[]>(`/dashboard/farms?district=${encodeURIComponent(district)}&limit=${limit}`)

/** Full timeline for a single farm */
export const getFarmTimeline = (farmId: number, days = 30) =>
  apiFetch<FarmTimeline>(`/dashboard/farm/${farmId}/timeline?days=${days}`)

/** Advisory trend (daily counts) */
export const getAdvisoryTrend = (days = 14) =>
  apiFetch<AdvisoryTrend>(`/dashboard/advisory-trend?days=${days}`)

/** Fetch & store fresh weather for a farm */
export const getFarmWeather = (farmId: number) =>
  apiFetch<{ summary: Record<string, number | string>; daily: WeatherForecast[] }>(
    `/weather/farm/${farmId}`
  )

/** Stored forecast records */
export const getStoredForecast = (farmId: number, days = 7) =>
  apiFetch<{ farm_id: number; records: WeatherForecast[] }>(
    `/weather/farm/${farmId}/forecast?days=${days}`
  )

/** Fetch all advisories (paginated) */
export const getAdvisories = (limit = 20, skip = 0) =>
  apiFetch<Advisory[]>(`/advisories/list?limit=${limit}&skip=${skip}`)

/** Register a new farmer */
export const registerFarmer = (payload: FarmerRegisterPayload) =>
  apiFetch<{ id: number; name: string; phone: string }>(`/auth/register`, {
    method: "POST",
    body: JSON.stringify(payload),
  })

/** Health check */
export const healthCheck = () =>
  apiFetch<{ status: string; ml_model_ready: boolean; weather_api: boolean }>(`/health`.replace("/api", ""))
