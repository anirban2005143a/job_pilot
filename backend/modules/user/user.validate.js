// schemas/preference.schema.js

import { z } from "zod";

const MAX_STRING_LENGTH = 500;
const MAX_SHORT_STRING_LENGTH = 100;
const MAX_ARRAY_LENGTH = 10;

export const upsertPreferenceSchema = z.object({
  preferences: z
    .object({
      // =========================
      // Basic Preferences
      // =========================

      notice_period: z
        .string()
        .trim()
        .max(
          MAX_SHORT_STRING_LENGTH,
          `Notice period cannot exceed ${MAX_SHORT_STRING_LENGTH} characters`,
        )
        .default(""),

      start_date: z.coerce
        .date()
        .nullable()
        .default(null)
        .refine(
          (date) => {
            if (!date) return true;

            const maxDate = new Date();
            maxDate.setFullYear(maxDate.getFullYear() + 1);

            return date <= maxDate;
          },
          {
            message: "Start date cannot be more than 1 years in the future",
          },
        ),

      relocation_openness: z.enum(["yes", "no", "negotiable", ""]).default(""),

      employment_status: z
        .enum([
          "currently_working",
          "actively_looking",
          "open_to_offers",
          "just_browsing",
          "",
        ])
        .default(""),

      // =========================
      // Visa
      // =========================

      has_visa: z.enum(["yes", "no", ""]).default(""),

      visa_type: z
        .string()
        .trim()
        .max(
          MAX_SHORT_STRING_LENGTH,
          `Visa type cannot exceed ${MAX_SHORT_STRING_LENGTH} characters`,
        )
        .default(""),

      visa_countries: z
        .array(
          z
            .string()
            .trim()
            .min(1, "Country cannot be empty")
            .max(
              MAX_SHORT_STRING_LENGTH,
              `Country cannot exceed ${MAX_SHORT_STRING_LENGTH} characters`,
            ),
        )
        .max(
          MAX_ARRAY_LENGTH,
          `You can specify a maximum of ${MAX_ARRAY_LENGTH} visa countries`,
        )
        .default([]),

      work_authorization_in_current_country: z
        .enum(["yes", "no", ""])
        .default(""),

      sponsorship_requirement: z
        .enum(["no", "yes_now", "yes_future", "maybe", ""])
        .default(""),

      // =========================
      // Languages
      // =========================

      primary_languages: z
        .array(
          z.object({
            language: z
              .string()
              .trim()
              .min(1, "Language cannot be empty")
              .max(
                MAX_SHORT_STRING_LENGTH,
                `Language cannot exceed ${MAX_SHORT_STRING_LENGTH} characters`,
              ),

            proficiency: z.enum([
              "Native",
              "Fluent",
              "Professional",
              "Conversational",
              "Beginner",
            ]),
          }),
        )
        .max(
          MAX_ARRAY_LENGTH,
          `You can specify a maximum of ${MAX_ARRAY_LENGTH} languages`,
        )
        .default([]),

      // =========================
      // Role Experience
      // =========================

      role_experience: z
        .array(
          z.object({
            role: z
              .string()
              .trim()
              .min(1, "Role cannot be empty")
              .max(
                MAX_SHORT_STRING_LENGTH,
                `Role cannot exceed ${MAX_SHORT_STRING_LENGTH} characters`,
              ),

            years: z
              .number()
              .min(0, "Years cannot be negative")
              .max(50, "Years cannot exceed 50")
              .default(0),
          }),
        )
        .max(
          MAX_ARRAY_LENGTH,
          `You can specify a maximum of ${MAX_ARRAY_LENGTH} roles`,
        )
        .default([]),

      // =========================
      // Work Preferences
      // =========================

      work_mode: z
        .array(z.enum(["Remote", "Hybrid", "Onsite"]))
        .max(
          MAX_ARRAY_LENGTH,
          `You can specify a maximum of ${MAX_ARRAY_LENGTH} work modes`,
        )
        .default([]),

      city_preference: z
        .array(
          z
            .string()
            .trim()
            .min(1, "City cannot be empty")
            .max(
              MAX_SHORT_STRING_LENGTH,
              `City cannot exceed ${MAX_SHORT_STRING_LENGTH} characters`,
            ),
        )
        .max(
          MAX_ARRAY_LENGTH,
          `You can specify a maximum of ${MAX_ARRAY_LENGTH} cities`,
        )
        .default([]),

      country_preference: z
        .array(
          z
            .string()
            .trim()
            .min(1, "Country cannot be empty")
            .max(
              MAX_SHORT_STRING_LENGTH,
              `Country cannot exceed ${MAX_SHORT_STRING_LENGTH} characters`,
            ),
        )
        .max(
          MAX_ARRAY_LENGTH,
          `You can specify a maximum of ${MAX_ARRAY_LENGTH} countries`,
        )
        .default([]),

      // =========================
      // Company
      // =========================

      company_preference: z
        .string()
        .trim()
        .max(
          MAX_STRING_LENGTH,
          `Company preference cannot exceed ${MAX_STRING_LENGTH} characters`,
        )
        .default(""),

      // =========================
      // Salary
      // =========================

      minimum_salary: z
        .number()
        .min(0, "Minimum salary cannot be negative")
        .max(1_000_000_000, "Minimum salary cannot exceed 1 billion")
        .default(0),

      // =========================
      // Customer Free-Text Preference
      // =========================

      customer_preference: z
        .string()
        .trim()
        .max(
          MAX_STRING_LENGTH,
          `Customer preference cannot exceed ${MAX_STRING_LENGTH} characters`,
        )
        .default(""),
    })
    .strict(),
});

export const updateProfileSchema = z
  .object({
    full_name: z.string().trim().max(MAX_SHORT_STRING_LENGTH).optional(),
    phone: z.string().trim().max(MAX_SHORT_STRING_LENGTH).optional(),
    linkedin_url: z.string().trim().url().optional(),
    github_url: z.string().trim().url().optional(),
    portfolio_url: z.string().trim().url().optional(),
    max_applications_per_day: z.number().int().min(0).optional(),
  })
  .strict();

export const updateStatusSchema = z
  .object({
    status: z.enum(["active", "paused"]),
  })
  .strict();
