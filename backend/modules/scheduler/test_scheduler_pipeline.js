import mongoose from "mongoose";
import { getenv } from "../../config/env.js";
import { SchedulerPipeline } from "./schedulerPipeline.js";

// Change the import paths above if your project structure is different.

const MONGO_URI = getenv("MONGO_URI");

export const testSchedulerPipeline = async (jobId, userId) => {
  try {
    if (!jobId) {
      throw new Error("Job ID is required");
    }

    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!MONGO_URI) {
      throw new Error("MONGO_URI is required");
    }

    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);

    console.log("Connected to MongoDB");

    console.log("\n========== SCHEDULER PIPELINE TEST ==========");
    console.log("Job ID:", jobId);
    console.log("User ID:", userId);
    console.log("=============================================\n");

    // Create pipeline
    const pipeline = new SchedulerPipeline();

    console.log("Starting scheduler pipeline...\n");

    // Process scheduling
    await pipeline.schedule({
      jobId,
      userId,
    });

    console.log("\nScheduler pipeline completed successfully.");

  } catch (error) {
    console.error("\n========== TEST FAILED ==========");

    console.error("Error message:", error.message);

    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }

    console.error("Full error:");
    console.error(error);

    console.error("=================================");

  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();

    console.log("\nMongoDB connection closed");
  }
};

// Replace these with an actual Job ID and User ID
testSchedulerPipeline(
  "6a8358d22645704f6b223028",
  "6a82e389dd9014d98a495113"
);
