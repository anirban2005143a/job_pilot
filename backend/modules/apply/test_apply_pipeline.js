import mongoose from "mongoose";
import { getenv } from "../../config/env.js";
import { ApplyPipeline } from "./applyPipeline.js";

const MONGO_URI = getenv("MONGO_URI");

export const testApplyPipeline = async (jobId, userId) => {
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

    console.log("\n========== APPLY PIPELINE TEST ==========");
    console.log("Job ID:", jobId);
    console.log("User ID:", userId);
    console.log("=========================================\n");

    // Create pipeline
    const pipeline = new ApplyPipeline();

    console.log("Starting apply pipeline...\n");

    // Process application
    const application = await pipeline.process({
      jobId,
      userId,
    });

    console.log("\n========== APPLICATION RESULT ==========");

    console.log("Application ID:", application?._id);
    console.log("Status:", application?.status);
    console.log("External Application ID:", application?.externalApplicationId);

    console.log("=========================================\n");
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
    await mongoose.disconnect();

    console.log("\nMongoDB connection closed");
  }
};

// Replace these with an actual Job ID and User ID
testApplyPipeline("6a835b392645704f6b223034", "6a834763a53b6dd7c28ef282");
