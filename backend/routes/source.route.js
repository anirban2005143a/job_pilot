import { Router } from "express";
import { registerSource, updateSource } from "../modules/sources/source.controller.js";
import { authenticateUser } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { registerSourceSchema, updateSourceSchema } from "../modules/sources/source.validate.js";

export const sourceRoutes = Router();

/**
 * POST /api/source/register
 */
sourceRoutes.post(
  "/register",
  authenticateUser,
  validate(registerSourceSchema),
  registerSource,
);

/**
 * PATCH /api/source/:sourceName
 */
sourceRoutes.patch(
  "/update/:sourceName",
  authenticateUser,
  validate(updateSourceSchema),
  updateSource,
);
