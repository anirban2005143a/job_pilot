import mongoose from "mongoose";
import User from "./user.model.js";
import { getenv } from "../../config/env.js";
import { ResumeDocument } from "../resume/ResumeDocument.js";
import { LLMModule } from "../llm/llm.js";
import { JobModel } from "../job/job.repository.js";
import { JobMatch } from "../job/jobMatch.model.js";
import { JobClarification } from "../job/jobClarification.model.js";
import { schedulerQueue } from "../scheduler/scheduler.queue.js";

const MAX_RESUMES = Number(getenv("MAX_RESUMES") || 0);

export const uploadResumeController = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one resume",
      });
    }

    const userId = req.user._id;
    // Get current resume count before processing files.
    const user = await User.findById(userId);
    const currentResumeCount = user.resumes?.length ?? 0;
    const incomingResumeCount = req.files.length;

    const totalResumeCount = currentResumeCount + incomingResumeCount;
    if (totalResumeCount > MAX_RESUMES) {
      return res.status(400).json({
        success: false,
        message: `You can have a maximum of ${MAX_RESUMES} resumes.`,
        currentCount: currentResumeCount,
        requestedCount: incomingResumeCount,
        remainingSlots: Math.max(MAX_RESUMES - currentResumeCount, 0),
      });
    }

    const resumeDocuments = [];
    for (const file of req.files) {
      const resumeDocument = new ResumeDocument({ userId, file });
      await resumeDocument.process();
      resumeDocuments.push(resumeDocument);
      user.resumes.push(resumeDocument.getRelativePath());
    }

    const resumePaths = resumeDocuments.map((resumeDocument) =>
      resumeDocument.getRelativePath(),
    );

    // ------------------------------------------------
    // Generate / update resume summary
    // ------------------------------------------------

    let resumeSummary;
    const llmModule = new LLMModule(user);
    if (currentResumeCount === 0) {
      // First ever resume upload
      resumeSummary = await llmModule.summarizeAllResumes();
    } else {
      // Existing summary + newly uploaded resumes
      resumeSummary = user.summary || "";

      for (const resumeDocument of resumeDocuments) {
        const content = `
          CURRENT SUMMARY:
          ${resumeSummary}

          ADDITIONAL RESUME:
          ${resumeDocument.content}
        `;

        resumeSummary = await llmModule.getSummary(content);
      }
    }

    // Save updated user
    await User.findByIdAndUpdate(
      userId,
      { $push: { resumes: { $each: resumePaths } } },
      { new: true, runValidators: true },
    );

    await User.findByIdAndUpdate(
      userId,
      { $set: { summary: resumeSummary } },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: "Resume(s) uploaded successfully",
      resumes: resumePaths,
    });
  } catch (error) {
    console.error("Upload resume error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload resume",
      error: error.message,
    });
  }
};

export const upsertPreferenceController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          preferences,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Preferences updated successfully",
      preferences: user.preferences,
    });
  } catch (error) {
    console.error("addPreferenceController error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update preferences",
    });
  }
};

export const updateProfileController = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: req.body },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("updateProfileController error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

export const updateStatusController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { status } },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      status: user.status,
    });
  } catch (error) {
    console.error("updateStatusController error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};

export const jobDecisionController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { jobId, decision } = req.body;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid jobId",
      });
    }

    const [job, jobMatch, clarification] = await Promise.all([
      JobModel.findById(jobId),
      JobMatch.findOne({ jobId, userId }),
      JobClarification.findOne({ jobId, userId }),
    ]);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (!jobMatch) {
      return res.status(404).json({
        success: false,
        message: "Job match not found for this user",
      });
    }

    if (jobMatch.result !== "needs_clarification") {
      return res.status(400).json({
        success: false,
        message: "This job does not require clarification",
      });
    }

    if (!clarification) {
      return res.status(400).json({
        success: false,
        message: "No clarification decision is pending for this job",
      });
    }

    if (decision === "reject") {
      return res.status(200).json({
        success: true,
        message: "Job rejected successfully",
      });
    }

    // decision === "apply"
    await schedulerQueue.add("schedule-job", {
      jobId: job._id.toString(),
      userId: userId.toString(),
    });

    return res.status(200).json({
      success: true,
      message: "Job added to scheduler successfully",
      data: {
        jobId: job._id,
        userId,
        status: "scheduled",
      },
    });
  } catch (error) {
    console.error("jobDecisionController error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process job decision",
    });
  }
};
