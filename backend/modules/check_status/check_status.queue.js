import { Queue } from "bullmq";
import { getenv } from "../../config/env.js";

export const checkStatusQueue = new Queue("check-status-queue", {
  connection: {
    host: getenv("REDIS_HOST"),
    port: Number(getenv("REDIS_PORT")),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: false,
  },
});