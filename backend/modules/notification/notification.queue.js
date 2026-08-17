import { Queue } from "bullmq";
import { getenv } from "../../config/env.js";

export const notificationQueue = new Queue("notification-queue", {
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
