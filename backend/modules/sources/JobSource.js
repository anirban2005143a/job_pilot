import Source from "./source.model.js";

export class JobSource {
  // pollingInterval is in milisecond
  constructor(
    source_name,
    max_application_per_hour = 500,
    pollingInterval = 60 * 1000,
  ) {
    if (!source_name) {
      throw new Error("Source name is required");
    }
    this.source_name = source_name;
    this.max_application_per_hour = max_application_per_hour;
    this.pollingInterval = pollingInterval;
    this.sourceId = null
  }

  getMaxApplicationPerHour() {
    return this.max_application_per_hour;
  }

  async register() {
    const source = await Source.findOneAndUpdate(
      { name: this.source_name },
      {
        name: this.source_name,
        polling_interval: this.pollingInterval,
        max_applications_per_hour: this.max_application_per_hour,
        active: true,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    this.sourceId = source._id;
    return source;
  }

  async fetchJobs() {
    throw new Error("fetchJobs() must be implemented");
  }

  formatJobs(jobs) {
    throw new Error("formatJobs() must be implemented");
  }

  async applyJob() {
    throw new Error("applyJob() must be implemented");
  }

  async getJobs() {
    throw new Error("getJobs() must be implemented");
  }
}
