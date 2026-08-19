import { notificationQueue } from "./notification.queue.js";
import { notificationWorker } from "./notification.worker.js";

const startNotificationModule = async () => {
  try {
    // Clear existing notification jobs
    await notificationQueue.obliterate({
      force: true,
    });

    console.log("[Notification] Queue cleared.");
    console.log("[Notification] Module started.");

    // Graceful shutdown
    const shutdown = async () => {
      console.log("[Notification] Shutting down...");

      await notificationWorker.close();
      await notificationQueue.close();

      console.log("[Notification] Shutdown complete");

      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("[Notification] Failed to start:", error);

    process.exit(1);
  }
};

startNotificationModule();