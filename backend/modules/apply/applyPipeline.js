import User from "../user/user.model.js";
import { JobModel } from "../job/job.repository.js";
import Source from "../sources/source.model.js";

import { LLMModule } from "../llm/llm.js";
import { loadResumes } from "../resume/loadResumes.js";

import { incrementUserApplicationCount } from "../user/utils.js";

import { ApplicationModel } from "./application.model.js";
import {
  createJobSourceObject,
  getSourceImplementation,
} from "../sources/source.registry.js";

export class ApplyPipeline {
  async process({ jobId, userId }) {
    const [user, job] = await Promise.all([
      User.findById(userId),
      JobModel.findById(jobId),
    ]);

    if (!user) {
      console.log(`[Apply Pipeline]User ${userId} not found`);
      throw new Error(`[Apply Pipeline]User ${userId} not found`);
    }

    if (!job) {
      console.log(`[Apply Pipeline]Job ${jobId} not found`);
      throw new Error(`[Apply Pipeline]Job ${jobId} not found`);
    }

    if (user.status !== "active") {
      console.log(`[Apply Pipeline]User ${userId} not active`);
      throw new Error(`[Apply Pipeline]User ${userId} not active`);
    }

    const existingApplication = await ApplicationModel.findOne({
      jobId,
      userId,
    });

    if (existingApplication && existingApplication.status !== "failed") {
      console.log(
        `[Apply Pipeline] Application already exists for job ${jobId}, user ${userId}`,
      );
      return;
    }

    // Source must exist and be active
    const source = await Source.findById(job.sourceId);

    if (!source) {
      console.log(`[Apply Pipeline] Source ${job.sourceId} not found`);
      throw new Error(`[Apply Pipeline] Source ${job.sourceId} not found`);
    }

    if (!source.active) {
      console.log(`[Apply Pipeline] Source ${source.name} is inactive`);
      throw new Error(`[Apply Pipeline] Source ${source.name} is inactive`);
    }

    try {
      // Resolve implementation dynamically
      const SourceClass = getSourceImplementation(source.implementation);

      // Create the correct source implementation
      const jobSource = createJobSourceObject(source);

      console.log(`[Apply Pipeline] Loading user resumes`);
      // Load markdown resumes
      const resumes = await loadResumes(user.resumes);

      // Generate resume and cover letter
      const llm = new LLMModule(user, job);

      console.log(`[Apply Pipeline] Generating final resume for application`);
      const generatedResume = await llm.createMultipleResume(resumes);

      console.log(`[Apply Pipeline] Generating cover letter for application`);
      const coverLetter = await llm.createCoverLetter(generatedResume, job);

      // Apply through source
      console.log(
        `[Apply Pipeline] Applying to job ${jobId} for user ${userId}`,
      );
      const response = await jobSource.applyJob({
        job_id: job.jobId,
        user_id: user._id.toString(),
        name: user.name,
        email: user.email,
        resume: generatedResume,
        cover_letter: coverLetter,
      });

      // Persist application
      console.log(`[Apply Pipeline] Storing application details in DB`);
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
      console.log(`[Apply Pipeline] Update user delay apply count`);
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
