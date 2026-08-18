import mongoose from "mongoose";
import { JobSource } from "./JobSource.js";
import { JobSource1 } from "./sources/job_source_1.js";
import { getenv } from "../../config/env.js";
import { MongoDatabase } from "../../database/MongoDatabase.js";

// Change this to the actual API/base URL
const jobSource1_base_url = "http://localhost:5001";
const MONGO_URI = getenv("MONGO_URI");

async function testJobSource1() {
  let database;
  try {
    // Connect to MongoDB
    database = new MongoDatabase(getenv("MONGO_URI"));
    await database.connect();

    console.log("=================================");
    console.log("Testing Job Source 1");
    console.log("=================================");

    // 1. Register the source
    console.log("\nRegistering source...");

    const newSource1 = new JobSource(
      "Job Source 1",
      jobSource1_base_url,
      100,
      60 * 1000,
    );

    await newSource1.register();

    console.log("Source registered successfully");
    console.log("Source ID:", newSource1.sourceId);
    console.log("Source Name:", newSource1.source_name);

    // 2. Create the actual source
    const jobSource1 = new JobSource1(
      newSource1.sourceId,
      newSource1.source_name,
      jobSource1_base_url,
      100,
      60 * 1000,
    );

    console.log("\nSource instance created:");
    console.log(jobSource1);

    // 3. Call the API
    console.log("\nCalling API...");

    const jobs = await jobSource1.getJobs();

    // 4. Print response
    console.log("\n=================================");
    console.log("API RESPONSE");
    console.log("=================================");

    console.log("Number of jobs:", jobs?.length ?? 0);

    console.dir(jobs, {
      depth: null,
      colors: true,
    });

    if (jobs.length == 0) {
      console.log("No job found");
      console.log("\n=================================");
      console.log("Test completed");
      console.log("=================================");
      return;
    }

    const applicationData = {
      job_id: "job-101",
      user_id: "dummy-user-456",
      name: "Test User",
      email: "testuser@example.com",
      resume: "https://example.com/resume/test-user.pdf",
      cover_letter: "This is a dummy cover letter for testing purposes.",
    };

    console.log("\nSending application:");
    console.dir(applicationData, { depth: null });

    const job = jobs[0];
    console.log("\nApplying to job...");
    console.log("Job:", job);

    // 4. Call applyJob()
    const response = await jobSource1.applyJob(applicationData);

    // 5. Print API response
    console.log("\n=================================");
    console.log("APPLY JOB RESPONSE");
    console.log("=================================");

    console.dir(response, {
      depth: null,
      colors: true,
    });

    const shutdown = async () => {
      console.log("[JobSourceTest] Shutting down...");

      await database.disconnect();

      console.log("[JobSourceTest] Shutdown complete");

      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("\n=================================");
    console.error("TEST FAILED");
    console.error("=================================");

    console.error(error);

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Response:", error.response.data);
    }

    if (database) {
      await database.disconnect();
    }

    process.exit(1);
  }
}

testJobSource1();
