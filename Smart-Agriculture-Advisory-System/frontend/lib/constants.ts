/**
 * Application Constants
 * Centralized configuration, enum-like values, and magic strings
 */

// ── Districts ────────────────────────────────────────────────────────────

export const DISTRICTS = [
  "Kaira",
  "Vadodara",
  "Anand",
  "Banaskantha",
  "Botad",
  "Chhota Udaipur",
  "Dahod",
  "Dang",
  "Devbhoomi Dwarka",
  "Gandhinagar",
  "Gir Somnath",
  "Jamnagar",
  "Junagadh",
  "Kheda",
  "Kutch",
  "Mahisagar",
  "Morbi",
  "Narmada",
  "Navsari",
  "Panchmahal",
  "Patan",
  "Porbandar",
  "Rajkot",
  "Sabarkantha",
  "Salsuit",
  "Surat",
  "Surendranagar",
  "Tapi",
  "Valsad",
] as const

export type District = (typeof DISTRICTS)[number]

// ── Crops ────────────────────────────────────────────────────────────────

export const CROPS = [
  "Rice",
  "Wheat",
  "Maize",
  "Cotton",
  "Sugarcane",
  "Soybean",
  "Groundnut",
  "Mustard",
  "Barley",
  "Bajra",
  "Jowar",
  "Pulses",
  "Vegetables",
  "Fruits",
] as const

export type Crop = (typeof CROPS)[number]

// ── Advisory Types ───────────────────────────────────────────────────────

export const ADVISORY_TYPES = {
  irrigation: "Irrigation",
  pest: "Pest Management",
  disease: "Disease Prevention",
  harvest: "Harvesting",
  weather: "Weather Alert",
  soil: "Soil Health",
} as const

export type AdvisoryTypeKey = keyof typeof ADVISORY_TYPES

// ── Severity Levels ─────────────────────────────────────────────────────

export const SEVERITY_LEVELS = {
  low: { label: "Low", color: "bg-blue-100 text-blue-800", icon: "info" },
  medium: {
    label: "Medium",
    color: "bg-yellow-100 text-yellow-800",
    icon: "alert",
  },
  high: { label: "High", color: "bg-red-100 text-red-800", icon: "alert-circle" },
} as const

export type SeverityLevel = keyof typeof SEVERITY_LEVELS

// ── Languages ────────────────────────────────────────────────────────────

export const LANGUAGES = {
  en: "English",
  gu: "Gujarati",
  hi: "Hindi",
} as const

export type Language = keyof typeof LANGUAGES

// ── View Routes ──────────────────────────────────────────────────────────

export const VIEW_ROUTES = {
  dashboard: "dashboard",
  farm: "farm",
  advisories: "advisories",
  profile: "profile",
} as const

export type ViewRoute = (typeof VIEW_ROUTES)[keyof typeof VIEW_ROUTES]

// ── Navigation Items ─────────────────────────────────────────────────────

export const NAVIGATION_ITEMS = [
  { id: "dashboard" as const, label: "Dashboard", iconName: "LayoutDashboard" },
  { id: "farm" as const, label: "My Farm", iconName: "Sprout" },
  { id: "advisories" as const, label: "Advisories", iconName: "FileText" },
  { id: "profile" as const, label: "Profile", iconName: "User" },
] as const

export type NavigationItemId = (typeof NAVIGATION_ITEMS)[number]["id"]

// ── API Configuration ────────────────────────────────────────────────────

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second (exponential backoff after)
} as const

// ── Query Keys (React Query) ─────────────────────────────────────────────

export const QUERY_KEYS = {
  // Dashboard
  regionalStats: (district: string) => ["dashboard", "stats", district],
  farms: (district: string, limit: number) => ["farms", district, limit],
  farmTimeline: (farmId: number, days: number) => [
    "farm",
    farmId,
    "timeline",
    days,
  ],
  advisoryTrend: (days: number) => ["advisory", "trend", days],

  // Weather
  farmWeather: (farmId: number) => ["weather", farmId],
  forecast: (farmId: number, days: number) => ["forecast", farmId, days],

  // Advisories
  advisories: (limit: number, skip: number) => ["advisories", limit, skip],
  advisory: (id: number) => ["advisory", id],

  // User
  profile: () => ["profile"],
  preferences: () => ["preferences"],

  // Health
  health: () => ["health"],
} as const

// ── Pagination ───────────────────────────────────────────────────────────

export const PAGINATION_DEFAULTS = {
  pageSize: 20,
  maxPageSize: 100,
  minPageSize: 5,
} as const

// ── Table Settings ───────────────────────────────────────────────────────

export const TABLE_CONFIG = {
  rowsPerPage: [10, 20, 50],
  defaultRowsPerPage: 20,
} as const

// ── Timeouts (ms) ───────────────────────────────────────────────────────

export const TIMEOUTS = {
  apiRequest: 10000, // 10 seconds for API calls
  toast: 3000,
  debounce: 300,
  throttle: 1000,
  autoRefresh: 60000, // 1 minute
} as const

// ── Validation Rules ────────────────────────────────────────────────────

export const VALIDATION_RULES = {
  minNameLength: 2,
  maxNameLength: 100,
  minPhone: 10,
  maxPhone: 15,
  minArea: 0.1,
  maxArea: 10000,
  minConfidence: 0,
  maxConfidence: 1,
} as const

// ── Status Codes ────────────────────────────────────────────────────────

export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

// ── Error Messages ───────────────────────────────────────────────────────

export const ERROR_MESSAGES = {
  networkError: "Network error. Please check your connection.",
  serverError: "Server error. Please try again later.",
  notFound: "Resource not found.",
  unauthorized: "You are not authorized to perform this action.",
  validationError: "Please check your input and try again.",
  unknown: "An unexpected error occurred.",
} as const

// ── Success Messages ─────────────────────────────────────────────────────

export const SUCCESS_MESSAGES = {
  farmerRegistered: "Farmer registered successfully!",
  profileUpdated: "Profile updated successfully!",
  advisorySent: "Advisory sent successfully!",
  dataSaved: "Your data has been saved.",
} as const

// ── Default Values ───────────────────────────────────────────────────────

export const DEFAULTS = {
  district: "Kaira" as District,
  crop: "Rice" as Crop,
  language: "en" as Language,
  theme: "system" as const,
} as const

// ── Animation Durations (ms) ──────────────────────────────────────────────

export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 1000,
} as const

// ── Breakpoints (Tailwind) ────────────────────────────────────────────────

export const BREAKPOINTS = {
  xs: "320px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const

// ── Dashboard Thresholds ──────────────────────────────────────────────────

export const DASHBOARD_THRESHOLDS = {
  // Advisory severity distribution (should sum to 1.0)
  highPriority: 0.3,     // 30% of advisories
  mediumPriority: 0.4,   // 40% of advisories
  lowPriority: 0.3,      // 30% of advisories
  
  // Field health simulation range
  fieldHealthMin: 0.7,
  fieldHealthRandomMax: 0.3,
  
  // Regional advisory synthetic ID (placeholder)
  regionalAdvisoryId: 999,
  
  // Calendar display grid size
  calendarDays: 35,
} as const
