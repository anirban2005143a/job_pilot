import { getenv } from "../../config/env.js";

import { MongoDatabase } from "../../database/MongoDatabase.js";
import { JobModel } from "../job/job.repository.js";
import { JobMatch } from "../job/jobMatch.model.js";
import { JobClarification } from "../job/jobClarification.model.js";
import { ApplicationModel } from "../apply/application.model.js";
import User from "../user/user.model.js";

import { matchingQueue } from "../matching/matching.queue.js";
import { schedulerQueue } from "../scheduler/scheduler.queue.js";
import { clarificationQueue } from "../needsClarification/clarification.queue.js";

const recoveryIntervalDays = Number(
  getenv("OLD_JOB_RECOVERY_INTERVAL_DAYS") || 10,
);

const recoveryPollingIntervalSeconds = Number(
  getenv("OLD_JOB_RECOVERY_POLLING_INTERVAL_SECONDS") || 60,
);

const recoverOldJobs = async () => {
  const cutoffDate = new Date(
    Date.now() - recoveryIntervalDays * 24 * 60 * 60 * 1000,
  );

  const [jobs, users] = await Promise.all([
    JobModel.find({
      createdAt: {
        $gte: cutoffDate,
        $lte: new Date(),
      },
    }).select("_id"),

    User.find({
      status: "active",
    }).select("_id"),
  ]);

  console.log(
    `[Old Job Recovery] Checking ${jobs.length} old jobs for ${users.length} active users`,
  );

  for (const job of jobs) {
    const jobId = job._id.toString();
    for (const user of users) {
      const userId = user._id.toString();

      console.log(`[Job Processing] Checking jobId=${jobId}, userId=${userId}`);

      // 1. Check if match exists
      const match = await JobMatch.findOne({
        jobId,
        userId,
      });

      if (!match) {
        console.log(
          `[Job Processing] No JobMatch found for jobId=${jobId}, userId=${userId}. Adding to matching queue.`,
        );

        await matchingQueue.add("match-job", {
          jobId,
        });

        console.log(
          `[Job Processing] Added jobId=${jobId} to matching queue for userId=${userId}`,
        );

        continue;
      }

      console.log(
        `[Job Processing] JobMatch found for jobId=${jobId}, userId=${userId}, result=${match.result}`,
      );

      // 2. Direct apply
      if (match.result === "direct_apply") {
        console.log(
          `[Job Processing] Direct apply match for jobId=${jobId}, userId=${userId}. Checking application.`,
        );

        const application = await ApplicationModel.findOne({
          jobId,
          userId,
        });

        if (!application) {
          console.log(
            `[Job Processing] No application found for jobId=${jobId}, userId=${userId}. Adding to scheduler queue.`,
          );

          await schedulerQueue.add("schedule-job", {
            jobId,
            userId,
          });

          console.log(
            `[Job Processing] Added jobId=${jobId}, userId=${userId} to scheduler queue.`,
          );
        } else if (application.status === "failed") {
          console.log(
            `[Job Processing] Application exists but has failed for jobId=${jobId}, userId=${userId}. Adding to scheduler queue.`,
          );

          await schedulerQueue.add("schedule-job", {
            jobId,
            userId,
          });

          console.log(
            `[Job Processing] Re-added failed application for jobId=${jobId}, userId=${userId} to scheduler queue.`,
          );
        } else {
          console.log(
            `[Job Processing] Application already exists for jobId=${jobId}, userId=${userId}, status=${application.status}. Skipping scheduler.`,
          );
        }

        continue;
      }

      // 3. Needs clarification
      if (match.result === "needs_clarification") {
        console.log(
          `[Job Processing] Clarification required for jobId=${jobId}, userId=${userId}. Checking existing clarification.`,
        );

        const clarification = await JobClarification.findOne({
          jobId,
          userId,
        });

        if (!clarification) {
          console.log(
            `[Job Processing] No clarification found for jobId=${jobId}, userId=${userId}. Adding to clarification queue.`,
          );

          await clarificationQueue.add("clarify-job", {
            jobId,
            userId,
          });

          console.log(
            `[Job Processing] Added jobId=${jobId}, userId=${userId} to clarification queue.`,
          );
        } else {
          console.log(
            `[Job Processing] Clarification already exists for jobId=${jobId}, userId=${userId}, clarificationId=${clarification._id}. Skipping clarification queue.`,
          );
        }

        continue;
      }

      // 4. Unknown match result
      console.warn(
        `[Job Processing] Unknown match result for jobId=${jobId}, userId=${userId}: ${match.result}`,
      );
    }

    console.log(`[Job Processing] Finished processing jobId=${jobId}`);
  }
};

const startOldJobRecovery = async () => {
  let database;
  let interval;
  let isShuttingDown = false;

  try {
    // 1. Connect DB
    database = new MongoDatabase(getenv("MONGO_URI"));
    await database.connect();

    console.log("[Old Job Recovery] MongoDB connected");

    // 2. Start recovery polling
    recoverOldJobs();
    interval = setInterval(
      recoverOldJobs,
      recoveryPollingIntervalSeconds * 1000,
    );

    console.log("[Old Job Recovery] Recovery polling started");

    // 3. Graceful shutdown
    const shutdown = async (signal) => {
      if (isShuttingDown) return;

      isShuttingDown = true;

      console.log(`[Old Job Recovery] Received ${signal}. Shutting down...`);

      try {
        // Stop scheduling new recovery runs
        if (interval) {
          clearInterval(interval);
          interval = undefined;

          console.log("[Old Job Recovery] Recovery polling stopped");
        }

        // Disconnect from MongoDB
        if (database) {
          await database.disconnect();
          database = undefined;

          console.log("[Old Job Recovery] MongoDB disconnected");
        }

        console.log("[Old Job Recovery] Shutdown complete");

        process.exit(0);
      } catch (error) {
        console.error("[Old Job Recovery] Error during shutdown:", error);

        process.exit(1);
      }
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("[Old Job Recovery] Failed to start:", error);

    // If the interval was created before startup failed,
    // make sure it doesn't continue running.
    if (interval) {
      clearInterval(interval);
      interval = undefined;
    }

    // Disconnect DB if it was connected
    if (database) {
      try {
        await database.disconnect();
      } catch (disconnectError) {
        console.error(
          "[Old Job Recovery] Failed to disconnect MongoDB:",
          disconnectError,
        );
      }
    }

    process.exit(1);
  }
};

startOldJobRecovery();
