import { ApplicationModel } from "../apply/application.model.js";
import { checkStatusQueue } from "./check_status.queue.js";
import { getenv } from "../../config/env.js";

const STATUS_CHECK_INTERVAL =
  Number(getenv("STATUS_CHECK_INTERVAL_SECONDS") || 30) * 1000;

const produceStatusJobs = async () => {
  try {
    console.log("[Check Status Producer] Checking pending applications...");

    const applications = await ApplicationModel.find({
      status: "pending",
    });

    console.log(
      `[Check Status Producer] Found ${applications.length} pending application(s)`,
    );

    for (const application of applications) {
      // console.log(application);
      await checkStatusQueue.add("check-status", {
        applicationId: application._id.toString(),
        userId: application.userId.toString(),
        jobId: application.jobId.toString(),
        sourceId: application.sourceId.toString(),
        externalJobId: application.externalJobId.toString(),
        externalApplicationId: application.externalApplicationId.toString(),
      });
    }

    console.log(`[Check Status Producer] ${applications.length} Jobs added successfully`);
  } catch (error) {
    console.error("[Check Status Producer] Error:", error);
  }
};

export const startCheckStatusProducer = () => {
  console.log(
    `[Check Status Producer] Started. Interval: ${STATUS_CHECK_INTERVAL}ms`,
  );

  // Check immediately
  produceStatusJobs();

  // Keep checking forever
  return setInterval(produceStatusJobs, STATUS_CHECK_INTERVAL);
};
