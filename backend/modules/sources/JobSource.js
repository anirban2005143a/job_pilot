import Source from "./source.model.js";

export class JobSource {
  // pollingInterval is in milisecond
  constructor({
    source_name,
    base_url,
    active = true,
    max_application_per_hour = 500,
    pollingInterval = 60 * 1000,
    implementation = null,
  }) {
    if (!source_name) {
      throw new Error("Source name is required");
    }
    this.source_name = source_name;
    this.base_url = base_url;
    this.active = active;
    this.max_application_per_hour = max_application_per_hour;
    this.pollingInterval = pollingInterval;
    this.sourceId = null;
    this.implementation = implementation;
  }

  getMaxApplicationPerHour() {
    return this.max_application_per_hour;
  }

  async register() {
    if (!this.implementation) {
      throw new Error("Implementation is required");
    }

    const source = await Source.findOneAndUpdate(
      { name: this.source_name },
      {
        name: this.source_name,
        base_url: this.base_url,
        polling_interval: this.pollingInterval,
        max_applications_per_hour: this.max_application_per_hour,
        active: this.active,
        implementation: this.implementation,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    );

    this.sourceId = source._id;
    return source;
  }

  async update(updates) {
    const source = await Source.findOneAndUpdate(
      { name: this.source_name },
      updates,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!source) {
      throw new Error(`Source "${this.source_name}" not found`);
    }

    this.sourceId = source._id;

    return source;
  }

  async _fetchJobs() {
    throw new Error("_fetchJobs() must be implemented");
  }

  _formatJobs(jobs) {
    throw new Error("_formatJobs() must be implemented");
  }

  async applyJob() {
    throw new Error("applyJob() must be implemented");
  }

  async getJobs() {
    throw new Error("getJobs() must be implemented");
  }

  async checkStatus({ userId, jobId, application_id }) {
    throw new Error("checkStatus() must be implemented");
  }
}
