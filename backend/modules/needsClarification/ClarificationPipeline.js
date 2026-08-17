import axios from "axios";

import { getenv } from "../../config/env.js";
import { JobMatch } from "../job/jobMatch.model.js";
import { JobRepository } from "../job/job.repository.js";
import User from "../user/user.model.js";
import { notificationQueue } from "../notification/notification.queue.js";
import { JobClarification } from "../job/jobClarification.model.js";

export class ClarificationPipeline {
  async process(jobId, userId) {
    const jobRepository = new JobRepository();

    const job = await jobRepository.getJobById(jobId);

    const user = await User.findById(userId);

    const jobMatch = await JobMatch.findOne({ jobId, userId });

    if (!job || !user || !jobMatch) {
      console.error("[ClarificationPipeline] Missing required data", {
        job: !!job,
        user: !!user,
        jobMatch: !!jobMatch,
      });
      throw new Error("Job, user or job match not found");
    }

    const pythonServerUrl = `${getenv("PYTHON_SERVER_BASE_URL")}/clarify-job`;

    const response = await axios.post(pythonServerUrl, {
      job_data: job,
      user_data: user,
      match_result: jobMatch,
    });

    const clarification = response.data;

    if (!clarification) {
      console.error(
        "[ClarificationPipeline] No clarification content generated",
      );
      throw new Error("Clarification content was not generated");
    }

    console.log("[ClarificationPipeline] Validating clarification response");

    if (
      typeof clarification.needs_clarification !== "boolean" ||
      !clarification.summary ||
      !Array.isArray(clarification.clarification_points)
    ) {
      console.error(
        "[ClarificationPipeline] Invalid clarification response:",
        clarification,
      );
      throw new Error("[ClarificationPipeline] Invalid clarification response");
    }

    console.log("[ClarificationPipeline] Clarification validation passed");

    const jobClarification = await JobClarification.findOneAndUpdate(
      { jobId, userId },
      {
        jobId,
        userId,
        jobMatchId: jobMatch._id,

        needs_clarification: clarification.needs_clarification,
        summary: clarification.summary,
        clarification_points: clarification.clarification_points,
      },
      {
        upsert: true,
        new: true,
      },
    );

    console.log(
      "[ClarificationPipeline] Job clarification saved:",
      jobClarification?._id,
    );

    await notificationQueue.add("job-clarification", {
      userId,
      jobId,
      jobMatchId: jobMatch._id,
    });

    console.log("[ClarificationPipeline] Notification queued successfully");
    console.log("[ClarificationPipeline] Process completed\n");
  }
}
