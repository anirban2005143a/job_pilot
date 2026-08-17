import mongoose from "mongoose";

const jobMatchSchema = new mongoose.Schema(
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

        result: {
            type: String,
            enum: ["direct_apply", "reject", "needs_clarification"],
            required: true,
        },

        match_score: Number,
        reason: String,
        matching_skills: [String],
        missing_or_unclear: [String],
        critical_gaps: [String],
        future_work_experience: String,
    },
    { timestamps: true }
);

jobMatchSchema.index({ jobId: 1, userId: 1 }, { unique: true });

export const JobMatch = mongoose.model("JobMatch", jobMatchSchema);