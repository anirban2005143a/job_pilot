import mongoose from "mongoose";

const sourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    base_url: {
      type: String,
      required: true,
      trim: true,
    },
    polling_interval: {
      type: Number,
      required: true,
      min: 1000, // milliseconds
    },

    max_applications_per_hour: {
      type: Number,
      default: 0, // 0 = unlimited
      min: 0,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);
const Source = mongoose.model("Source", sourceSchema);

export default Source