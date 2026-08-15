import express from "express";
import { login, register } from "../auth/auth.controller.js";
import { loginSchema, registerSchema } from "../auth/auth.validation.js";
import { validate } from "../middleware/validate.js";

export const authRoutes = express.Router();

authRoutes.post(
  "/register",
  validate(registerSchema),
  register
);

authRoutes.post(
  "/login",
  validate(loginSchema),
  login
);
