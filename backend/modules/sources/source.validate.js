import { z } from "zod";

/**
 * Common source fields
 */
const sourceFields = {
  source_name: z
    .string()
    .trim()
    .min(1, "Source name is required")
    .max(100, "Source name must not exceed 100 characters"),

  base_url: z
    .string()
    .trim()
    .url("Base URL must be a valid URL"),

  active: z.boolean({
    message: "Active must be a boolean",
  }),

  implementation: z
    .string()
    .trim()
    .min(1, "Source Implementation is required")
    .max(100, "Source Implementation must not exceed 100 characters"),

  max_application_per_hour: z
    .number()
    .int("Max applications per hour must be an integer")
    .min(0, "Max applications per hour cannot be negative")
    .max(
      100000,
      "Max applications per hour cannot exceed 100000",
    ),

  pollingInterval: z
    .number()
    .int("Polling interval must be an integer")
    .min(1000, "Polling interval must be at least 1000 ms")
    .max(
      24 * 60 * 60 * 1000,
      "Polling interval cannot exceed 24 hours",
    ),
};

/**
 * Register schema
 *
 * All fields are required except fields with defaults.
 */
export const registerSourceSchema = z.object({
  ...sourceFields,

  active: sourceFields.active.default(true),

  max_application_per_hour:
    sourceFields.max_application_per_hour.default(500),

  pollingInterval:
    sourceFields.pollingInterval.default(60 * 1000),
});

/**
 * Update schema
 *
 * Every field is optional because the client may
 * update only one property.
 */
export const updateSourceSchema = z
  .object({
    source_name: sourceFields.source_name.optional(),

    base_url: sourceFields.base_url.optional(),

    active: sourceFields.active.optional(),

    max_application_per_hour:
      sourceFields.max_application_per_hour.optional(),

    pollingInterval:
      sourceFields.pollingInterval.optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field is required to update the source",
    },
  );