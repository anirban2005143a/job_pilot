import { Worker } from "bullmq";
import { matchingQueue } from "./matching.queue.js";
import { MatchingPipeline } from "./MatchingPipeline.js";
import { getenv } from "../../config/env.js";

const pipeline = new MatchingPipeline();

export const matchingWorker = new Worker(
  matchingQueue.name,
  async (job) => {
    const { jobId } = job.data;
    console.log(`[Matching Worker] Recieved Job id ${jobId}`)
    await pipeline.process(jobId);
  },
  {
    connection: {
      host: getenv("REDIS_HOST"),
      port: Number(getenv("REDIS_PORT")),
    },
  },
);

matchingWorker.on("completed", (job) => {
    console.log(`[Matching Worker] Job ${job.id} completed`);
});

matchingWorker.on("failed", (job, err) => {
    console.error(
        `[Matching Worker] Job ${job?.id} failed:`,
        err
    );
});

console.log("Matching Worker Started...");