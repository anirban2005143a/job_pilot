import { getenv } from "../../config/env.js";
import { MongoDatabase } from "../../database/MongoDatabase.js";
import { checkStatusQueue } from "./check_status.queue.js";
import { checkStatusWorker } from "./check_status.worker.js";
import { startCheckStatusProducer } from "./check_status.producer.js";

const startStatusModule = async () => {
  let database;
  let producerInterval;

  try {
    // Connect DB
    database = new MongoDatabase(getenv("MONGO_URI"));
    await database.connect();

    console.log("[Check Status] Database connected");

    // Clear old queue jobs
    await checkStatusQueue.obliterate({
      force: true,
    });

    console.log("[Check Status] Queue cleared");

    // Start producer
    producerInterval = startCheckStatusProducer();

    console.log("[Check Status] Module started");

    // Graceful shutdown
    const shutdown = async () => {
      console.log("[Check Status] Shutting down...");

      if (producerInterval) {
        clearInterval(producerInterval);
      }

      await checkStatusWorker.close();
      await checkStatusQueue.close();
      await database.disconnect();

      console.log("[Check Status] Shutdown complete");

      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("[Check Status] Failed to start:", error);

    if (producerInterval) {
      clearInterval(producerInterval);
    }

    if (database) {
      await database.disconnect();
    }

    process.exit(1);
  }
};

startStatusModule();