import { Worker } from "bullmq";

import { getenv } from "../../config/env.js";
import { clarificationQueue } from "./clarification.queue.js";
import { ClarificationPipeline } from "./ClarificationPipeline.js";

const pipeline = new ClarificationPipeline();

export const clarificationWorker = new Worker(
  clarificationQueue.name,

  async (job) => {
    const { jobId, userId } = job.data;

    console.log(
      `[Clarification Worker] Processing job ${jobId} for user ${userId}`,
    );

    await pipeline.process(jobId, userId);
  },

  {
    connection: {
      host: getenv("REDIS_HOST"),
      port: Number(getenv("REDIS_PORT")),
    },
  },
);

clarificationWorker.on("completed", (job) => {
  console.log(`[Clarification Worker] Job ${job.id} completed`);
});

clarificationWorker.on("failed", (job, err) => {
  console.error(
    `[Clarification Worker] Job ${job?.id} failed:`,
    err,
  );
});

console.log("Clarification Worker Started...");