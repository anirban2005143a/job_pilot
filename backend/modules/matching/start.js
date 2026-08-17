import { getenv } from "../../config/env.js";
import { MongoDatabase } from "../../database/MongoDatabase.js";
import { matchingQueue } from "./matching.queue.js";
import { matchingWorker } from "./matching.worker.js";

const startMatchingModule = async () => {
  let database;

  try {
    // 1. Connect DB
    database = new MongoDatabase(getenv("MONGO_URI"));
    await database.connect();

    // 2. Clear existing matching jobs
    await matchingQueue.obliterate({
      force: true,
    });

    console.log("Matching queue cleared.");
    console.log("Matching module started.");

    // 3. Graceful shutdown
    const shutdown = async () => {
      console.log("[Matching] Shutting down...");

      await matchingWorker.close();
      await matchingQueue.close();

      await database.disconnect();

      console.log("[Matching] Shutdown complete");

      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("[Matching] Failed to start:", error);

    if (database) {
      await database.disconnect();
    }

    process.exit(1);
  }
};

startMatchingModule();