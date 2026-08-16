import { Queue } from "bullmq";

export const matchingQueue = new Queue("job-matching", {
  connection: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
  },
});