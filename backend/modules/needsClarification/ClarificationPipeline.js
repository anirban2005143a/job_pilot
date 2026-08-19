import axios from "axios";
import { getenv } from "../../config/env.js";
import { JobMatch } from "../job/jobMatch.model.js";
import { JobRepository } from "../job/job.repository.js";
import User from "../user/user.model.js";
import { notificationQueue } from "../notification/notification.queue.js";
import { JobClarification } from "../job/jobClarification.model.js";
import { LLMModule } from "../llm/llm.js";
import { createClarificationEmail } from "../notification/notification.service.js";

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
      throw new Error(
        "[ClarificationPipeline] Job, user or job match not found",
      );
    }

    if (user.status !== "active") {
      console.error(
        "[ClarificationPipeline] User is not active. User id : ",
        user._id?.toString(),
      );
      throw new Error(
        `[ClarificationPipeline] User is not active. User id : ${user._id?.toString()}`,
      );
    }

    const existingClarification = await JobClarification.findOne({
      jobId,
      userId,
    });

    if (existingClarification) {
      console.log(
        `[ClarificationPipeline] Clarification already exists for userId=${userId}, jobId=${jobId}`,
      );

      return;
    }

    const llm = new LLMModule(user, job);

    const clarification = await llm.clarifyJob(jobMatch);

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

    const message = `Needs your clarification before proceeding with this job in company ${job.company} and role ${job.title}`;
    const subject = `JobPilot - Clarification Required | ${job.company} | ${job.title}`;
    const html = createClarificationEmail({
      company: job.company,
      jobTitle: job.title,
      message,
      jobId: job._id.toString(),
      frontendUrl: getenv("FRONTEND_URL"),
    });

    await notificationQueue.add("job-clarification", {
      notificationType: "need-clarification",
      userId,
      jobId: job._id.toString(),
      message,
      html,
      subject,
    });

    console.log("[ClarificationPipeline] Notification queued successfully");
  }
}
