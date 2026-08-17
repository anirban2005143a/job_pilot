import { getenv } from "../../config/env.js";
import { MongoDatabase } from "../../database/MongoDatabase.js";
import { schedulerQueue } from "./scheduler.queue.js";
import { schedulerWorker } from "./scheduler.worker.js";

const startSchedulerModule = async () => {
  let database;

  try {
    // 1. Connect DB
    database = new MongoDatabase(getenv("MONGO_URI"));
    await database.connect();

    // 2. Clear existing scheduler jobs
    await schedulerQueue.obliterate({
      force: true,
    });

    console.log("[Scheduler] Queue cleared.");
    console.log("[Scheduler] Module started.");

    // 3. Graceful shutdown
    const shutdown = async () => {
      console.log("[Scheduler] Shutting down...");

      await schedulerWorker.close();
      await schedulerQueue.close();

      await database.disconnect();

      console.log("[Scheduler] Shutdown complete");

      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("[Scheduler] Failed to start:", error);

    if (database) {
      await database.disconnect();
    }

    process.exit(1);
  }
};

startSchedulerModule();