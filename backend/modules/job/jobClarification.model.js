import mongoose from "mongoose";

const clarificationPointSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    summary: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const jobClarificationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    jobMatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobMatch",
      required: true,
    },

    needs_clarification: {
      type: Boolean,
      required: true,
    },

    summary: {
      type: String,
      required: true,
    },

    clarification_points: {
      type: [clarificationPointSchema],
      default: [],
    },
  },
  { timestamps: true },
);

jobClarificationSchema.index(
  { jobId: 1, userId: 1 },
  { unique: true },
);

export const JobClarification = mongoose.model(
  "JobClarification",
  jobClarificationSchema,
);