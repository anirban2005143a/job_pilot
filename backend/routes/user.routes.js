import express from "express";
import { validate } from "../middleware/validate.js";
import { uploadResume } from "../middleware/multer.js";
import {
  addPreferenceController,
  uploadResumeController,
} from "../modules/user/user.controller.js";
import { addPreferenceSchema } from "../modules/user/user.validate.js";
import { authenticateUser } from "../middleware/auth.js";
import { getenv } from "../config/env.js";

export const userRoutes = express.Router();
const MAX_RESUMES = Number(getenv("MAX_RESUMES") || 0);

// console.log("from env file MAX_RESUMES ", MAX_RESUMES)

userRoutes.post(
  "/upload-resume",
  authenticateUser,
  uploadResume.array("resumes", MAX_RESUMES),
  uploadResumeController,
);

userRoutes.post(
  "/add-preference",
  authenticateUser,
  validate(addPreferenceSchema),
  addPreferenceController,
);
