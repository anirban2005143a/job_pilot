import { getenv } from "../../config/env.js";
import { MongoDatabase } from "../../database/MongoDatabase.js";
import { applyQueue } from "./apply.queue.js";
import { applyWorker } from "./apply.worker.js";

const startApplyModule = async () => {
  let database;

  try {
    // 1. Connect DB
    database = new MongoDatabase(getenv("MONGO_URI"));
    await database.connect();

    // 2. Clear existing apply jobs
    await applyQueue.obliterate({
      force: true,
    });

    console.log("[Apply] Queue cleared.");
    console.log("[Apply] Module started.");

    // 3. Graceful shutdown
    const shutdown = async () => {
      console.log("[Apply] Shutting down...");

      await applyWorker.close();
      await applyQueue.close();

      await database.disconnect();

      console.log("[Apply] Shutdown complete");

      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("[Apply] Failed to start:", error);

    if (database) {
      await database.disconnect();
    }

    process.exit(1);
  }
};

startApplyModule();