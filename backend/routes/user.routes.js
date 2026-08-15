import express from "express";
import { validate } from "../middleware/validate.js";
import { uploadResume } from "../middleware/multer.js";
import { addPreferenceController, uploadResumeController } from "../user/user.controller.js";
import { addPreferenceSchema } from "../user/user.validate.js";
import { authenticateUser } from "../middleware/auth.js";

export const userRoutes = express.Router();

userRoutes.post(
  "/upload-resume",
  authenticateUser,
  uploadResume.array("resumes", 5),
  uploadResumeController
);

userRoutes.post(
  "/add-preference",
  authenticateUser,
  validate(addPreferenceSchema),
  addPreferenceController
);
