
import { getenv } from "../../config/env.js";
import { MongoDatabase } from "../../database/MongoDatabase.js";
import { clarificationQueue } from "./clarification.queue.js";
import { clarificationWorker } from "./clarification.worker.js";

const startClarificationModule = async () => {
  let database;

  try {
    // 1. Connect DB
    database = new MongoDatabase(getenv("MONGO_URI"));
    await database.connect();

    // 2. Clear existing clarification jobs
    await clarificationQueue.obliterate({
      force: true,
    });

    console.log("[Clarification] Queue cleared.");
    console.log("[Clarification] Module started.");

    // 3. Graceful shutdown
    const shutdown = async () => {
      console.log("[Clarification] Shutting down...");

      await clarificationWorker.close();
      await clarificationQueue.close();

      await database.disconnect();

      console.log("[Clarification] Shutdown complete");

      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("[Clarification] Failed to start:", error);

    if (database) {
      await database.disconnect();
    }

    process.exit(1);
  }
};

startClarificationModule();
