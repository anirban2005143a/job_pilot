import { getenv } from "../../config/env.js";
import { MongoDatabase } from "../../database/MongoDatabase.js";
import { checkStatusQueue } from "./check_status.queue.js"; 
import { checkStatusWorker } from "./check_status.worker.js"; 
import { startCheckStatusProducer } from "./check_status.producer.js"; 

const startStatusModule = async () => {
  let database;
  let producerInterval;

  try {
    // 1. Connect DB
    database = new MongoDatabase(getenv("MONGO_URI"));
    await database.connect();

    // 2. Clear existing status jobs
    await checkStatusQueue.obliterate({
      force: true,
    });

    console.log("Status queue cleared.");

    // 3. Start producer
    producerInterval = startCheckStatusProducer();

    console.log("Status module started.");

    // 4. Graceful shutdown
    const shutdown = async () => {
      console.log("[Status] Shutting down...");

      if (producerInterval) {
        clearInterval(producerInterval);
      }

      await checkStatusWorker.close();
      await checkStatusQueue.close();

      await database.disconnect();

      console.log("[Status] Shutdown complete");

      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("[Status] Failed to start:", error);

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