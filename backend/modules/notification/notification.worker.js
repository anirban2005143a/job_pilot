import { Worker } from "bullmq";
import { Novu } from "@novu/api";

import { getenv } from "../../config/env.js";
import { notificationQueue } from "./notification.queue.js";

const novu = new Novu({
  secretKey: getenv("NOVU_SECRET_KEY"),
});

export const notificationWorker = new Worker(
  notificationQueue.name,

  async (job) => {
    const { notificationType, userId, jobId, message, html, subject } =
      job.data;

    await novu.trigger({
      workflowId: notificationType,

      to: {
        subscriberId: userId,
      },

      payload: {
        message,
        jobId,
        notificationType,
        html,
        subject,
      },
    });
  },

  {
    connection: {
      host: getenv("REDIS_HOST"),
      port: Number(getenv("REDIS_PORT")),
    },
  },
);

notificationWorker.on("completed", (job) => {
  console.log(`[Notification Worker] Job ${job.id} completed`);
});

notificationWorker.on("failed", (job, err) => {
  console.error(`[Notification Worker] Job ${job?.id} failed:`, err);
});

console.log("Notification Worker Started...");
