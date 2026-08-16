import mongoose from "mongoose";
import { getenv } from "../../config/env.js";
import User from "../../modules/user/user.model.js";
import { LLMModule } from "../../modules/llm/llm.js";

// Change these paths if your project structure is different

const MONGO_URI = getenv("MONGO_URI");

export const testMatchJob = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!MONGO_URI) {
      throw new Error("MONGO_URI is required");
    }

    // Connect to MongoDB
    // await mongoose.connect(MONGO_URI);

    // console.log("Connected to MongoDB");

    // Fetch user
    const user = await User.findById(userId);

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    console.log("User found:");
    console.log({
      id: user._id,
      email: user.email,
      summary: user.summary,
      preferences: user.preferences,
    });

    // Create LLM module
    const llm = new LLMModule(user);

    // Sample job object
    const job = {
      id: "job-101",
      title: "Frontend Developer",
      company: "TechCorp",
      cities: ["Chennai", "Bangalore"],
      countries: ["India"],
      is_remote: "true",
      is_hybride: "true",
      is_onsite: "false",
      salary_offered: "₹8,00,000 - ₹14,00,000 per year",
      visa_sponsorship_offered: "false",
      start_date: "2026-09-15",
      required_skills: [
        "React",
        "TypeScript",
        "JavaScript",
        "HTML",
        "CSS",
        "Git",
      ],
      description:
        "Build responsive customer-facing interfaces using React and TypeScript. Work closely with designers and backend engineers to create reusable components and improve frontend performance.",
    };

    console.log("\nSending job to matchJob...\n");

    // Call matchJob
    const result = await llm.matchJob(job);

    console.log("========== MATCH JOB RESULT ==========");
    console.dir(result, { depth: null });
    console.log("======================================");

    return result;
  } catch (error) {
    console.error("\n========== TEST FAILED ==========");
    console.error(error);
    console.error("=================================");
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log("\nMongoDB connection closed");
  }
};

