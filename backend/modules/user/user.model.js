import mongoose from "mongoose";
import { getenv } from "../../config/env.js";

const MAX_RESUMES = Number(getenv("MAX_RESUMES") || 0);

const DEFAULT_MAX_APPLICATIONS_PER_DAY = 1000;

const userSchema = new mongoose.Schema(
  {
    // =========================
    // Authentication
    // =========================

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
      select: false,
    },

    // =========================
    // Profile
    // =========================

    full_name: {
      type: String,
      default: "",
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    linkedin_url: {
      type: String,
      default: "",
      trim: true,
    },

    github_url: {
      type: String,
      default: "",
      trim: true,
    },

    portfolio_url: {
      type: String,
      default: "",
      trim: true,
    },

    summary: {
      type: String,
      default: "",
    },

    // =========================
    // Resumes
    // =========================

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

    // =========================
    // Job Preferences
    // =========================

    preferences: {
      notice_period: {
        type: String,
        default: "",
      },

      start_date: {
        type: Date,
        default: null,
      },

      relocation_openness: {
        type: String,
        enum: ["yes", "no", "negotiable", ""],
        default: "",
      },

      employment_status: {
        type: String,
        enum: [
          "currently_working",
          "actively_looking",
          "open_to_offers",
          "just_browsing",
          "",
        ],
        default: "",
      },

      has_visa: {
        type: String,
        enum: ["yes", "no", ""],
        default: "",
      },

      visa_type: {
        type: String,
        default: "",
      },

      visa_countries: {
        type: [String],
        default: [],
      },

      work_authorization_in_current_country: {
        type: String,
        enum: ["yes", "no", ""],
        default: "",
      },

      sponsorship_requirement: {
        type: String,
        enum: ["no", "yes_now", "yes_future", "maybe", ""],
        default: "",
      },

      primary_languages: {
        type: [
          {
            language: {
              type: String,
              required: true,
            },

            proficiency: {
              type: String,
              enum: [
                "Native",
                "Fluent",
                "Professional",
                "Conversational",
                "Beginner",
              ],
              required: true,
            },
          },
        ],
        default: [],
      },

      role_experience: {
        type: [
          {
            role: {
              type: String,
              required: true,
            },

            years: {
              type: Number,
              min: 0,
              default: 0,
            },
          },
        ],
        default: [],
      },

      work_mode: {
        type: [
          {
            type: String,
            enum: ["Remote", "Hybrid", "Onsite"],
          },
        ],
        default: [],
      },

      city_preference: {
        type: [String],
        default: [],
      },

      country_preference: {
        type: [String],
        default: [],
      },

      company_preference: {
        type: String,
        default: "",
      },

      minimum_salary: {
        type: Number,
        min: 0,
        default: 0,
      },
      customer_preference: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // =========================
    // Automation / Application
    // =========================

    status: {
      type: String,
      enum: ["active", "paused"],
      default: "active", // will create a endpoint to change the status value 
    },

    max_applications_per_day: {
      type: Number,
      min: 0,
      default: DEFAULT_MAX_APPLICATIONS_PER_DAY,
    },

    applications_today: {
      type: Number,
      min: 0,
      default: 0,
    },

    applications_today_reset_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
