import { Worker } from "bullmq";

import { getenv } from "../../config/env.js";
import { checkStatusQueue } from "./check_status.queue.js";
import Source from "../sources/source.model.js";
import { ApplicationModel } from "../apply/application.model.js";
import { createJobSourceObject } from "../sources/source.registry.js";
import { createApplicationStatusEmail } from "../notification/notification.service.js";
import { notificationQueue } from "../notification/notification.queue.js";

export const checkStatusWorker = new Worker(
  checkStatusQueue.name,

  async (job) => {
    const {
      applicationId,
      userId,
      jobId,
      sourceId,
      externalJobId,
      externalApplicationId,
    } = job.data;

    console.log(`[Check Status Worker] Checking application: ${applicationId}`);

    // Check source
    const source = await Source.findById(sourceId);

    if (!source) {
      console.error(`[Check Status Worker] Source not found: ${sourceId}`);
      throw new Error(`Source not found: ${sourceId}`);
    }

    // Check application
    const application = await ApplicationModel.findById(applicationId);

    if (!application) {
      console.error(
        `[Check Status Worker] Application not found: ${applicationId}`,
      );
      throw new Error(`Application not found: ${applicationId}`);
    }

    const previousStatus = application.status;
    console.log(`[Check Status Worker] Current status: ${previousStatus}`);

    // Create the correct source implementation
    const jobSource = createJobSourceObject(source);

    // Check status from job source
    console.log(`[Check Status Worker] Calling ${source.name} status API...`);

    const data = await jobSource.checkStatus({
      userId: userId,
      jobId: externalJobId,
    });

    const status = data?.status;

    if (!status || typeof status !== "string") {
      console.error(
        `[Check Status Worker] Invalid status received from ${source.name}`,
      );
      throw new Error("Invalid application status");
    }

    console.log(`[Check Status Worker] New status: ${status}`);

    // Update database
    await ApplicationModel.findByIdAndUpdate(applicationId, {
      $set: {
        status,
      },
    });

    console.log(
      `[Check Status Worker] Application updated: ${applicationId} -> ${status}`,
    );

    // Send notification only when status changed to accepted/rejected
    const normalizedPreviousStatus = previousStatus?.toLowerCase();
    const normalizedStatus = status.toLowerCase();
    const statusChanged = normalizedPreviousStatus !== normalizedStatus;
    const shouldNotify =
      statusChanged && ["accepted", "rejected"].includes(normalizedStatus);

    if (!shouldNotify) {
      console.log(
        `[Check Status Worker] No notification required. Previous: ${previousStatus}, New: ${status}`,
      );
      return {
        applicationId,
        status,
      };
    }

    console.log(
      `[Check Status Worker] Status changed from ${previousStatus} to ${status}. Preparing notification...`,
    );

    // Create notification content
    const isAccepted = normalizedStatus === "accepted";
    const message = isAccepted
      ? `Great news! Your application for ${application.jobTitle || "this position"} has been accepted.`
      : `Your application for ${application.jobTitle || "this position"} has been rejected.`;
    const subject = isAccepted
      ? `JobPilot - Application Accepted`
      : `JobPilot - Application Update`;

    const html = createApplicationStatusEmail({
      status: normalizedStatus,
      company: application.company || source.name,
      jobTitle: application.jobTitle || "Job Application",
      message,
      jobId: jobId || application._id.toString(),
      frontendUrl: getenv("FRONTEND_URL"),
    });

    await notificationQueue.add("application-status", {
      notificationType: "status-update",
      userId,
      jobId: jobId || application._id.toString(),
      message,
      html,
      subject,
    });

    console.log(
      `[Check Status Worker] ${status} notification queued successfully`,
    );

    return {
      applicationId,
      status,
    };
  },

  {
    connection: {
      host: getenv("REDIS_HOST"),
      port: Number(getenv("REDIS_PORT")),
    },
  },
);

checkStatusWorker.on("completed", (job) => {
  console.log(`[Check Status Worker] Job completed: ${job.id}`);
});

checkStatusWorker.on("failed", (job, error) => {
  console.error(`[Check Status Worker] Job failed: ${job?.id}`, error);
});

console.log("[Check Status Worker] Started...");
