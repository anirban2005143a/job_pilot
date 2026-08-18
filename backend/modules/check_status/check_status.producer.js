import { ApplicationModel } from "../apply/application.model.js";
import { checkStatusQueue } from "./check_status.queue.js";
import { getenv } from "../../config/env.js";

const STATUS_CHECK_INTERVAL =
  Number(getenv("STATUS_CHECK_INTERVAL_SECONDS") || 30) * 1000;

const produceStatusJobs = async () => {
  const applications = await ApplicationModel.find({
    status: "pending",
  }).select("_id userId jobId sourceId");

  for (const application of applications) {
    await checkStatusQueue.add("check-status", {
      applicationId: application._id.toString(),
      userId: application.userId.toString(),
      jobId: application.jobId.toString(),
      sourceId: application.sourceId.toString(),
    });
  }
};

export const startCheckStatusProducer = () => {
  produceStatusJobs();

  setInterval(produceStatusJobs, STATUS_CHECK_INTERVAL);
};
