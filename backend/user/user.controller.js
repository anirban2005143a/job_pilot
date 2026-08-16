import fs from "fs/promises";
import path from "path";
import { getenv } from "../config/env.js";
import User from "./user.model.js";
import { ResumeDocument } from "./resume/ResumeDocument.js";

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
    const user = await User.findById(userId).select("resumes");
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
    }

    const resumePaths = resumeDocuments.map((resumeDocument) =>
      resumeDocument.getRelativePath(),
    );

    await User.findByIdAndUpdate(
      userId,
      { $push: { resumes: { $each: resumePaths } } },
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

export const addPreferenceController = async (req, res) => {
  try {
    const { preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $addToSet: {
          preferences: {
            $each: preferences,
          },
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    return res.status(200).json({
      message: "Preferences added successfully",
      preferences: user.preferences,
    });
  } catch (error) {
    console.error("Add preference error:", error);

    return res.status(500).json({
      message: "Failed to add preferences",
      error: error.message,
    });
  }
};

const extractResumeContent = async (file) => {
  return "new things";
};
