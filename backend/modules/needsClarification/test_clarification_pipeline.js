import mongoose from "mongoose";
import { getenv } from "../../config/env.js";
import { ClarificationPipeline } from "./ClarificationPipeline.js"; 

// Change the import path above if your project structure is different.

const MONGO_URI = getenv("MONGO_URI");

export const testClarificationPipeline = async (jobId, userId) => {
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

    console.log("\n========== CLARIFICATION PIPELINE TEST ==========");
    console.log("Job ID:", jobId);
    console.log("User ID:", userId);
    console.log("=================================================\n");

    // Create pipeline
    const pipeline = new ClarificationPipeline();

    console.log("Starting clarification pipeline...\n");

    // Process clarification
    await pipeline.process(jobId, userId);

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
testClarificationPipeline(
  "6a847edb8a8d6ce568f4dba6",
  "6a82e389dd9014d98a495113"
);