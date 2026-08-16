import mongoose from "mongoose";
import { getenv } from "../config/env.js";

const MAX_RESUMES = Number(getenv("MAX_RESUMES") || 0);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },

    password: {
      type: String,
      required: true,
    },

    resumes: {
      type: [String],
      default: [],
      validate: {
        validator: function (resumes) {
          return resumes.length <= MAX_RESUMES;
        },
        message: `A user can have a maximum of ${MAX_RESUMES} resumes.`,
      },
    },

    preferences: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
