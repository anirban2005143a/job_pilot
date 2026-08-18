import { Worker } from "bullmq";

import { getenv } from "../../config/env.js";
import { applyQueue } from "./apply.queue.js";
import { ApplyPipeline } from "./applyPipeline.js";

const pipeline = new ApplyPipeline();

export const applyWorker = new Worker(
  applyQueue.name,

  async (job) => {
    const { jobId, userId } = job.data;

    console.log(
      `[Apply Worker] Processing job ${jobId} for user ${userId}`,
    );

    return pipeline.process({
      jobId,
      userId,
    });
  },

  {
    connection: {
      host: getenv("REDIS_HOST"),
      port: Number(getenv("REDIS_PORT")),
    },
  },
);

applyWorker.on("completed", (job) => {
  console.log(
    `[Apply Worker] Job ${job.id} completed`,
  );
});

applyWorker.on("failed", (job, err) => {
  console.error(
    `[Apply Worker] Job ${job?.id} failed:`,
    err,
  );
});

console.log("Apply Worker Started...");