import { getenv } from "../../config/env.js";
import { JobRepository } from "../job/job.repository.js";
import { matchingQueue } from "../matching/matching.queue.js";

const BATCH_SIZE = Number(getenv("MATCH_QUEUE_BATCH_SIZE") || 20);

export class JobCollector {
  constructor() {
    this.sources = new Map();
    this.timers = new Map();

    this.jobRepository = new JobRepository();
    this.matchingQueue = matchingQueue;

    this.stopped = false;
  }

  //source - JobSource object
  registerSource(source) {
    if (!source || !source.source_name) {
      throw new Error("Invalid job source");
    }

    if (this.sources.has(source.source_name)) {
      throw new Error(`Source already registered: ${source.source_name}`);
    }

    this.sources.set(source.source_name, source);
    console.log(`Job Source - ${source.source_name} registered Successfully`);
  }

  //source - JobSource object
  async pollSource(source) {
    try {
      const jobs = await source.getJobs();

      const newJobs = await this.jobRepository.saveJobs(source.sourceId, jobs);

      if (newJobs.length > 0) {
        await this.pushToMatchingQueue(newJobs);
      }

      console.log(
        `[Collector] ${source.source_name}: fetched=${jobs.length}, new=${newJobs.length}`,
      );
    } catch (error) {
      console.error(`[Collector] ${source.source_name} failed:`, error.message);
    }
  }

  async pollLoop(source) {
    while (!this.stopped) {
      const startedAt = Date.now();

      await this.pollSource(source);

      const elapsed = Date.now() - startedAt;
      const delay = Math.max(0, source.pollingInterval - elapsed);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  async pushToMatchingQueue(jobs) {
    for (const job of jobs) {
      await this.matchingQueue.add("match-job", {
        jobId: job._id.toString(),
      });
    }
  }

  async start() {
    console.log(`[Collector] Started with ${this.getSources().length} sources`);
    for (const source of this.sources.values()) {
      this.pollLoop(source);
    }
  }

  stop() {
    this.stopped = true;
  }

  getSources() {
    return Array.from(this.sources.values());
  }
}
