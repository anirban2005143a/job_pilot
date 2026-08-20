import express from "express";

import { authenticateUser } from "../middleware/auth.js";

import {
  getUserController,
  getAppliedJobsController,
  getAppliedJobController,
  getJobClarificationsController,
  getJobClarificationController,
} from "../modules/dashboard/dashboard.controller.js";

export const dashboardRoutes = express.Router();

dashboardRoutes.get(
  "/user",
  authenticateUser,
  getUserController,
);

dashboardRoutes.get(
  "/applied-jobs",
  authenticateUser,
  getAppliedJobsController,
);

dashboardRoutes.get(
  "/applied-jobs/:jobId",
  authenticateUser,
  getAppliedJobController,
);

dashboardRoutes.get(
  "/clarifications",
  authenticateUser,
  getJobClarificationsController,
);

dashboardRoutes.get(
  "/clarifications/:jobId",
  authenticateUser,
  getJobClarificationController,
);