import { z } from "zod";

export const addPreferenceSchema = z.object({
  preferences: z
    .array(
      z.string().trim().min(1, "Preference cannot be empty")
    )
    .default([])
});