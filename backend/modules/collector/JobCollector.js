export class JobCollector {
  constructor(jobRepository, matchingQueue) {
    this.sources = new Map();
    this.timers = new Map();

    this.jobRepository = jobRepository;
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
  }

  async pollSource(source) {
    try {
      const jobs = await source.getJobs();

      const newJobs = await this.jobRepository.saveJobs(
        source.source_name,
        jobs,
      );

      if (newJobs.length > 0) {
        await this.matchingQueue.addBulk(
          newJobs.map((job) => ({
            name: "match-job",
            data: {
              jobId: job._id.toString(),
            },
          })),
        );
      }

      console.log(
        `[Collector] ${source.source_name}: fetched=${jobs.length}, new=${newJobs.length}`,
      );
    } catch (error) {
      console.error(`[Collector] ${source.source_name} failed:`, error.message);
    }
  }

  async start() {
    for (const source of this.sources.values()) {
      this.pollLoop(source);
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

  stop() {
    this.stopped = true;
  }

  getSources() {
    return Array.from(this.sources.values());
  }
}
