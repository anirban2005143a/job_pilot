import { Worker } from "bullmq";

import { getenv } from "../../config/env.js";
import { checkStatusQueue } from "./check_status.queue.js";
import Source from "../sources/source.model.js";
import { ApplicationModel } from "../apply/application.model.js";
import { JobSource1 } from "../sources/sources/job_source_1.js";

export const checkStatusWorker = new Worker(
  checkStatusQueue.name,

  async (job) => {
    const { applicationId, userId, jobId, sourceId } = job.data;

    const source = await Source.findById(sourceId);

    if (!source) {
      console.logError(`[Check Status Module] Source not found: ${sourceId}`);
      throw new Error(`[Check Status Module] Source not found: ${sourceId}`);
    }

    const application = await ApplicationModel.findById(applicationId);

    if (!application) {
      console.log(
        `[Check Status Module] Application not found: ${applicationId}`,
      );
      throw new Error(
        `[Check Status Module] Application not found: ${applicationId}`,
      );
    }

    const jobSource = new JobSource1(
      source._id,
      source.name,
      source.base_url,
      source.max_applications_per_hour,
      source.polling_interval,
    );

    const data = await jobSource.checkStatus({
      userId,
      jobId,
    });
    const status = data?.status;

    if (!status || typeof status !== "string") {
      console.log(
        `[Check Status Module] Status not found from job source : ${source.name}`,
      );
      throw new Error(
        `[Check Status Module] Status not found from job source : ${source.name}`,
      );
    }

    await ApplicationModel.findByIdAndUpdate(applicationId, {
      $set: {
        status,
      },
    });
  },

  {
    connection: {
      host: getenv("REDIS_HOST"),
      port: Number(getenv("REDIS_PORT")),
    },
  },
);

console.log("Status Worker Started...");
