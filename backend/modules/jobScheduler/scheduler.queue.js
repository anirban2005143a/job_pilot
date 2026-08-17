import { Queue } from "bullmq";
import { getenv } from "../../config/env.js";

export const schedulerQueue = new Queue("scheduler-queue", {
  connection: {
    host: getenv("REDIS_HOST"),
    port: Number(getenv("REDIS_PORT")),
  },
});
