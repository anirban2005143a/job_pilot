import path from "path";
import mongoose from "mongoose";

import User from "../user/user.model.js";
import { ApplicationModel } from "../apply/application.model.js";
import { JobModel } from "../job/job.repository.js";
import { JobMatch } from "../job/jobMatch.model.js";
import { JobClarification } from "../job/jobClarification.model.js";

const getPdfFileName = (resumePath) => {
  if (!resumePath) return null;

  const filename = path.basename(resumePath);

  // Stored value is the generated markdown file:
  // uuid_resume-name.md
  // Return the corresponding PDF filename.
  return filename.replace(/\.md$/i, ".pdf");
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getUserController = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.resumes = (user.resumes || []).map(getPdfFileName);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("getUserController error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

export const getAppliedJobsController = async (req, res) => {
  try {
    const userId = req.user._id;

    const applications = await ApplicationModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: { $ne: "failed" },
        },
      },

      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      {
        $unwind: "$job",
      },

      {
        $lookup: {
          from: "jobmatches",
          let: {
            jobId: "$jobId",
            userId: "$userId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$jobId", "$$jobId"] },
                    { $eq: ["$userId", "$$userId"] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 0,
                match_score: 1,
                matching_skills: 1,
                reason: 1,
              },
            },
          ],
          as: "match",
        },
      },

      {
        $unwind: {
          path: "$match",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 0,
          applicationId: "$_id",
          jobId: 1,

          title: "$job.title",
          company: "$job.company",
          cities: "$job.cities",
          countries: "$job.countries",

          is_remote: "$job.is_remote",
          is_hybride: "$job.is_hybride",
          is_onsite: "$job.is_onsite",

          status: 1,
          applied_at: 1,

          match_score: "$match.match_score",
          matching_skills: "$match.matching_skills",
          reason: "$match.reason",
        },
      },

      {
        $sort: {
          applied_at: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.error("getAppliedJobsController error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch applied jobs",
    });
  }
};

export const getAppliedJobController = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job id",
      });
    }

    const application = await ApplicationModel.findOne({
      userId,
      jobId,
      status: { $ne: "failed" },
    }).lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Applied job not found",
      });
    }

    const [job, match] = await Promise.all([
      JobModel.findById(jobId).lean(),

      JobMatch.findOne({
        userId,
        jobId,
      }).lean(),
    ]);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        job: {
          id: job._id,
          sourceId: job.sourceId,
          externalJobId: job.jobId,
          title: job.title,
          company: job.company,
          cities: job.cities,
          countries: job.countries,

          is_remote: job.is_remote,
          is_hybride: job.is_hybride,
          is_onsite: job.is_onsite,

          salary_offered: job.salary_offered,
          visa_sponsorship_offered: job.visa_sponsorship_offered,
          start_date: job.start_date,

          required_skills: job.required_skills,
          description: job.description,
        },

        match: match
          ? {
              result: match.result,
              match_score: match.match_score,
              matching_skills: match.matching_skills,
              missing_or_unclear: match.missing_or_unclear,
              critical_gaps: match.critical_gaps,
              future_work_experience: match.future_work_experience,
              reason: match.reason,
            }
          : null,

        application: {
          id: application._id,
          sourceId: application.sourceId,
          externalApplicationId: application.externalApplicationId,
          externalJobId: application.externalJobId,

          resume: application.resume,
          cover_letter: application.cover_letter,

          status: application.status,
          applied_at: application.applied_at,
          response: application.response,
        },
      },
    });
  } catch (error) {
    console.error("getAppliedJobController error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch applied job",
    });
  }
};

export const getJobClarificationsController = async (req, res) => {
  try {
    const userId = req.user._id;

    const clarifications = await JobClarification.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          needs_clarification: true,
        },
      },

      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      {
        $unwind: "$job",
      },

      {
        $lookup: {
          from: "jobmatches",
          localField: "jobMatchId",
          foreignField: "_id",
          as: "match",
        },
      },
      {
        $unwind: {
          path: "$match",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 0,
          clarificationId: "$_id",
          jobId: 1,

          title: "$job.title",
          company: "$job.company",
          cities: "$job.cities",
          countries: "$job.countries",

          is_remote: "$job.is_remote",
          is_hybride: "$job.is_hybride",
          is_onsite: "$job.is_onsite",

          summary: 1,
          clarification_points: 1,
          createdAt: 1,

          match_score: "$match.match_score",
          matching_skills: "$match.matching_skills",
        },
      },

      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: clarifications.length,
      data: clarifications,
    });
  } catch (error) {
    console.error("getJobClarificationsController error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch job clarifications",
    });
  }
};

export const getJobClarificationController = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job id",
      });
    }

    const clarification = await JobClarification.findOne({
      userId,
      jobId,
      needs_clarification: true,
    }).lean();

    if (!clarification) {
      return res.status(404).json({
        success: false,
        message: "Job clarification not found",
      });
    }

    const [job, match] = await Promise.all([
      JobModel.findById(jobId).lean(),

      JobMatch.findOne({
        userId,
        jobId,
      }).lean(),
    ]);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        job: {
          id: job._id,
          sourceId: job.sourceId,
          externalJobId: job.jobId,
          title: job.title,
          company: job.company,
          cities: job.cities,
          countries: job.countries,

          is_remote: job.is_remote,
          is_hybride: job.is_hybride,
          is_onsite: job.is_onsite,

          salary_offered: job.salary_offered,
          visa_sponsorship_offered: job.visa_sponsorship_offered,
          start_date: job.start_date,

          required_skills: job.required_skills,
          description: job.description,
        },

        match: match
          ? {
              result: match.result,
              match_score: match.match_score,
              matching_skills: match.matching_skills,
              missing_or_unclear: match.missing_or_unclear,
              critical_gaps: match.critical_gaps,
              future_work_experience: match.future_work_experience,
              reason: match.reason,
            }
          : null,

        clarification: {
          id: clarification._id,
          summary: clarification.summary,
          clarification_points: clarification.clarification_points,
          createdAt: clarification.createdAt,
          updatedAt: clarification.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("getJobClarificationController error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch job clarification",
    });
  }
};