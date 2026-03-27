/**
 * Zod Validation Schemas
 * Centralized form validation with runtime type safety
 */

import { z } from "zod"
import { VALIDATION_RULES, CROPS, DISTRICTS } from "./constants"

// ── Farmer Registration Schema ───────────────────────────────────────────

export const FarmerRegisterSchema = z.object({
  name: z
    .string()
    .min(VALIDATION_RULES.minNameLength, "Name is too short")
    .max(VALIDATION_RULES.maxNameLength, "Name is too long")
    .refine((val) => /^[a-zA-Z\s]*$/.test(val), "Name can only contain letters"),

  phone: z
    .string()
    .min(VALIDATION_RULES.minPhone, "Invalid phone number")
    .max(VALIDATION_RULES.maxPhone, "Invalid phone number")
    .refine((val) => /^\d+$/.test(val), "Phone must contain only numbers")
    .refine((val) => val.startsWith("91") || val.length === 10, {
      message: "Phone must be valid Indian number (10 or 12 digits with 91 prefix)",
    }),

  village: z
    .string()
    .min(2, "Village name is required")
    .max(100, "Village name is too long"),

  district: z
    .string()
    .refine(
      (val) => (DISTRICTS as readonly string[]).includes(val),
      "Invalid district selected"
    ),

  state: z.string().min(2, "State is required"),

  latitude: z
    .number()
    .min(-90, "Invalid latitude")
    .max(90, "Invalid latitude")
    .default(22.75),

  longitude: z
    .number()
    .min(-180, "Invalid longitude")
    .max(180, "Invalid longitude")
    .default(72.68),

  crop_name: z.string().refine(
    (val) => (CROPS as readonly string[]).includes(val),
    "Invalid crop type"
  ),

  area_hectares: z
    .number()
    .min(VALIDATION_RULES.minArea, "Area must be at least 0.1 hectare")
    .max(VALIDATION_RULES.maxArea, "Area is too large")
    .optional(),

  sowing_date: z
    .string()
    .refine(
      (val) => {
        // Accept both YYYY-MM-DD and ISO datetime formats
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const datetimeRegex = /^\d{4}-\d{2}-\d{2}T/;
        return dateRegex.test(val) || datetimeRegex.test(val);
      },
      "Invalid date format"
    )
    .refine(
      (val) => new Date(val) <= new Date(),
      "Sowing date cannot be in the future"
    )
    .transform((val) => {
      // Convert YYYY-MM-DD to ISO datetime if needed
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return `${val}T00:00:00Z`;
      }
      return val;
    }),

  consented_advisory: z
    .boolean()
    .refine((val) => val === true, "You must consent to receive advisories"),

  consented_data_use: z
    .boolean()
    .refine((val) => val === true, "You must consent to data usage terms"),

  preferred_language: z.enum(["en", "gu", "hi"]).default("en"),
})

export type FarmerRegisterFormData = z.infer<typeof FarmerRegisterSchema>

// ── Farmer Profile Update Schema ────────────────────────────────────────

export const FarmerProfileUpdateSchema = FarmerRegisterSchema.partial().extend({
  id: z.number().positive("Invalid farmer ID"),
})

export type FarmerProfileUpdateFormData = z.infer<typeof FarmerProfileUpdateSchema>

// ── Weather Filter Schema ────────────────────────────────────────────────

export const WeatherFilterSchema = z.object({
  farmId: z.number().positive().optional(),
  days: z.number().int().min(1).max(30).default(7),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export type WeatherFilterFormData = z.infer<typeof WeatherFilterSchema>

// ── Advisory Filter Schema ───────────────────────────────────────────────

export const AdvisoryFilterSchema = z.object({
  severity: z.enum(["low", "medium", "high"]).optional(),
  advisoryType: z
    .enum(["irrigation", "pest", "disease", "harvest", "weather", "soil"])
    .optional(),
  district: z.string().optional(),
  crop: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  searchTerm: z.string().max(100).optional(),
})

export type AdvisoryFilterFormData = z.infer<typeof AdvisoryFilterSchema>

// ── Farm Filter Schema ───────────────────────────────────────────────────

export const FarmFilterSchema = z.object({
  district: z.string().optional(),
  crop: z.string().optional(),
  minArea: z.number().min(0).optional(),
  maxArea: z.number().min(0).optional(),
  searchTerm: z.string().max(100).optional(),
})

export type FarmFilterFormData = z.infer<typeof FarmFilterSchema>

// ── Pagination Schema ────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(20),
})

export type PaginationFormData = z.infer<typeof PaginationSchema>

// ── Search Schema ────────────────────────────────────────────────────────

export const SearchSchema = z.object({
  query: z.string().max(100).optional(),
  district: z.string().optional(),
  type: z.enum(["farm", "farmer", "advisory"]).default("farm"),
})

export type SearchFormData = z.infer<typeof SearchSchema>

// ── Login Schema (Future) ────────────────────────────────────────────────

export const LoginSchema = z.object({
  phone: z
    .string()
    .min(10, "Invalid phone number")
    .refine((val) => /^\d+$/.test(val), "Phone must contain only numbers"),
  otp: z.string().length(6, "OTP must be 6 digits"),
})

export type LoginFormData = z.infer<typeof LoginSchema>

// ── Validation Helper Functions ──────────────────────────────────────────

/**
 * Validate data against schema and return typed result
 */
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): z.SafeParseReturnType<unknown, T> {
  return schema.safeParse(data)
}

/**
 * Get first error message from validation result
 */
export function getFirstError(
  result: z.SafeParseReturnType<unknown, unknown>
): string | null {
  if (result.success) return null
  const errors = result.error.flatten().fieldErrors as Record<string, string[]>
  const firstField = Object.keys(errors)[0]
  return firstField ? errors[firstField]?.[0] ?? null : null
}

/**
 * Convert Zod errors to field-level error object
 */
export function zodErrorsToFieldErrors(
  error: z.ZodError
): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  error.flatten().fieldErrors

  for (const [field, messages] of Object.entries(
    error.flatten().fieldErrors
  )) {
    fieldErrors[field] = messages?.[0] ?? "Invalid input"
  }

  return fieldErrors
}

// ── Safe Parsing Helpers ────────────────────────────────────────────────

/**
 * Parse data with schema, throwing on error
 */
export function parseFarmerRegister(data: unknown): FarmerRegisterFormData {
  return FarmerRegisterSchema.parse(data)
}

/**
 * Parse data with schema, returning null on error
 */
export function tryParseFarmerRegister(
  data: unknown
): FarmerRegisterFormData | null {
  const result = FarmerRegisterSchema.safeParse(data)
  return result.success ? result.data : null
}
