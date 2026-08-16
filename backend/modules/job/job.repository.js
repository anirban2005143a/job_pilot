import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    sourceId: {
      type: String,
      required: true,
    },

    externalJobId: {
      type: String,
      required: true,
    },

    title: String,
    company: String,
    cities: [String],
    countries: [String],
    is_remote: Boolean,
    is_hybride: Boolean,
    is_onsite: Boolean,
    salary_offered: mongoose.Schema.Types.Mixed,
    visa_sponsorship_offered: Boolean,
    start_date: mongoose.Schema.Types.Mixed,
    required_skills: [String],
    description: String,

    status: {
      type: String,
      enum: [
        "discovered",
        "matched",
        "scheduled",
        "applied",
        "rejected",
        "needs_clarification",
      ],
      default: "discovered",
    },
  },
  { timestamps: true },
);

jobSchema.index({ sourceId: 1, externalJobId: 1 }, { unique: true });

const JobModel = mongoose.model("Job", jobSchema);

export class JobRepository {
  async saveJobs(sourceId, jobs) {
    if (!jobs.length) return [];

    const operations = jobs.map((job) => ({
      updateOne: {
        filter: {
          sourceId,
          externalJobId: job.id,
        },
        update: {
          $setOnInsert: {
            sourceId,
            externalJobId: job.id,
            ...job,
            status: "discovered",
          },
        },
        upsert: true,
      },
    }));

    const result = await JobModel.bulkWrite(operations);

    if (result.upsertedCount === 0) {
      return [];
    }

    const insertedIds = Object.values(result.upsertedIds);

    return JobModel.find({
      _id: { $in: insertedIds },
    });
  }
}
