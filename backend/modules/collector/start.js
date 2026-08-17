import { getenv } from "../../config/env.js";
import { MongoDatabase } from "../../database/MongoDatabase.js";

import { JobCollector } from "./JobCollector.js";
import { JobRepository } from "../job/job.repository.js";
import { matchingQueue } from "../matching/matching.queue.js";
import { JobSource1 } from "../sources/sources/job_source_1.js";
import { JobSource } from "../sources/JobSource.js";

const jobSource1_base_url = getenv("JOBSOURCE1_BASE_URL");

const startCollector = async () => {
  let database;

  console.log(getenv("MONGO_URI"));

  try {
    // 1. Connect DB
    database = new MongoDatabase(getenv("MONGO_URI"));
    await database.connect();

    // 2. Dependencies
    const jobRepository = new JobRepository();

    const collector = new JobCollector();

    // 3. Register sources
    const newSource1 = new JobSource("Job Source 1", 100, 60 * 1000);
    await newSource1.register()
    console.log(newSource1.sourceId, )
    const jobSource1 = new JobSource1(
      newSource1.sourceId,
      newSource1.source_name,
      jobSource1_base_url,
      100,
      60 * 1000,
    );

    //register source to collector 
    collector.registerSource(jobSource1);

    // 4. Start continuous polling
    await collector.start();

    // 5. Graceful shutdown
    const shutdown = async () => {
      console.log("[Collector] Shutting down...");

      collector.stop();

      await matchingQueue.close();

      await database.disconnect();

      console.log("[Collector] Shutdown complete");

      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("[Collector] Failed to start:", error);

    if (database) {
      await database.disconnect();
    }

    process.exit(1);
  }
};

startCollector();
