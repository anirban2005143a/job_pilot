import User from "../user/user.model.js";
import { JobModel } from "../job/job.repository.js";
import Source from "../sources/source.model.js";
import { JobSource1 } from "../sources/sources/job_source_1.js";

import { LLMModule } from "../llm/llm.js";
import { loadResumes } from "../resume/loadResumes.js";

import { incrementUserApplicationCount } from "../user/utils.js";

import { ApplicationModel } from "./application.model.js";

export class ApplyPipeline {
  async process({ jobId, userId }) {
    const [user, job] = await Promise.all([
      User.findById(userId),
      JobModel.findById(jobId),
    ]);

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const existingApplication = await ApplicationModel.findOne({
      jobId,
      userId,
    });

    if (existingApplication && existingApplication.status !== "failed") {
      console.log(
        `[Apply Pipeline] Application already exists for job ${jobId}, user ${userId}`,
      );

      return existingApplication;
    }

    // Source must exist and be active
    const source = await Source.findById(job.sourceId);

    if (!source) {
      throw new Error(`Source ${job.sourceId} not found`);
    }

    if (!source.active) {
      throw new Error(`Source ${source.name} is inactive`);
    }

    try {
      // Create concrete source object
      const jobSource = new JobSource1(
        source._id,
        source.name,
        source.base_url,
        source.max_applications_per_hour,
        source.polling_interval,
      );

      // Load markdown resumes
      const resumes = await loadResumes(user.resumes);

      // Generate resume and cover letter
      const llm = new LLMModule(user, job);

      const generatedResume = await llm.createMultipleResume(resumes);

      const coverLetter = await llm.createCoverLetter(generatedResume, job);

      // Apply through source
      const response = await jobSource.applyJob({
        job_id: job.jobId,
        user_id: user._id.toString(),
        name: user.name,
        email: user.email,
        resume: generatedResume,
        cover_letter: coverLetter,
      });

      // Persist application
      const application = await ApplicationModel.persistApplication({
        existingApplication,
        userId,
        jobId,
        sourceId: source._id,
        resume: generatedResume,
        cover_letter: coverLetter,
        response,
        status: response?.status || "pending",
      });

      // Update application count
      await incrementUserApplicationCount(User, user);

      return application;
    } catch (error) {
      // Persist failed application
      await ApplicationModel.persistApplication({
        existingApplication,
        userId,
        jobId,
        sourceId: source._id,
        status: "failed",
        error: error.message,
      });

      console.log("[Apply Pipeline]", error);

      throw error;
    }
  }
}
