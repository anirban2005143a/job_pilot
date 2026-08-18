import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Source",
      required: true,
    },

    externalApplicationId: {
      type: String,
      default: null,
    },

    resume: {
      type: String,
      default: "",
    },

    cover_letter: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "failed"],
      default: "pending",
    },

    applied_at: {
      type: Date,
      default: Date.now,
    },

    response: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

applicationSchema.statics.persistApplication = async function ({
  existingApplication,
  userId,
  jobId,
  sourceId,
  resume,
  cover_letter,
  response,
  status,
  error,
}) {
  const data = {
    userId,
    jobId,
    sourceId,
    resume: resume ?? null,
    cover_letter: cover_letter ?? null,
    status,
    externalApplicationId:
      response?.application_id ?? null,
    applied_at:
      status === "failed" ? null : new Date(),
    response: response ?? null,
    error: error ?? null,
  };

  if (existingApplication) {
    return this.findByIdAndUpdate(
      existingApplication._id,
      { $set: data },
      { new: true },
    );
  }

  return this.create(data);
};


export const ApplicationModel = mongoose.model(
  "Application",
  applicationSchema,
);
