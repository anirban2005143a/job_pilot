import axios from "axios";

import { getenv } from "../../config/env.js";
import { JobMatch } from "../job/jobMatch.model.js";
import { JobRepository } from "../job/job.repository.js";
import User from "../user/user.model.js";
import { notificationQueue } from "../notification/notification.queue.js";
import { JobClarification } from "../job/jobClarification.model.js";

export class ClarificationPipeline {
  async process(jobId, userId) {
    console.log(
      `[ClarificationPipeline] Processing clarification for userId=${userId}, jobId=${jobId}`,
    );

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

    const llm = new LLMModule(user);

    const clarification = await llm.clarifyJob(job, user, jobMatch);

    if (!clarification) {
      console.error(
        "[ClarificationPipeline] No clarification content generated",
      );
      throw new Error("Clarification content was not generated");
    }

    console.log("[ClarificationPipeline] Validating clarification response");

    if (
      !clarification ||
      !clarification.summary ||
      typeof clarification.summary !== "string" ||
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

        needs_clarification: true,
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
      jobClarification?._id?.toString(),
    );

    await notificationQueue.add("job-clarification", {
      type: "clarify",
      userId,
      jobId,
      clarificationId: jobClarification._id,
    });

    console.log("[ClarificationPipeline] Notification queued successfully");
  }
}
