import express from "express";
import { validate } from "../middleware/validate.js";
import { uploadResume } from "../middleware/multer.js";
import {
  upsertPreferenceController,
  updateProfileController,
  updateStatusController,
  uploadResumeController,
  jobDecisionController,
  extractUserInfoController,
} from "../modules/user/user.controller.js";
import {
  jobDecisionSchema,
  updateProfileSchema,
  updateStatusSchema,
  upsertPreferenceSchema,
} from "../modules/user/user.validate.js";
import { authenticateUser } from "../middleware/auth.js";
import { getenv } from "../config/env.js";

export const userRoutes = express.Router();
const MAX_RESUMES = Number(getenv("MAX_RESUMES") || 0);

// console.log("from env file MAX_RESUMES ", MAX_RESUMES)
userRoutes.get(
  "/extract-user-info",
  authenticateUser,
  extractUserInfoController,
);

userRoutes.post(
  "/upload-resume",
  authenticateUser,
  uploadResume.array("resumes", MAX_RESUMES),
  uploadResumeController,
);

userRoutes.post(
  "/upsert-preference",
  authenticateUser,
  validate(upsertPreferenceSchema),
  upsertPreferenceController,
);

userRoutes.patch(
  "/update/profile",
  authenticateUser,
  validate(updateProfileSchema),
  updateProfileController,
);

userRoutes.patch(
  "/update/status",
  authenticateUser,
  validate(updateStatusSchema),
  updateStatusController,
);

userRoutes.post(
  "/job-decision",
  authenticateUser,
  validate(jobDecisionSchema),
  jobDecisionController,
);