export class JobSource {
  // pollingInterval is in milisecond
  constructor(
    source_name,
    max_application_per_hour = 500,
    pollingInterval = 60 * 1000,
    source_id = null
  ) {
    if(!source_name){
      throw new Error("Source name is required");
    }
    this.source_name = source_name;
    this.max_application_per_hour = max_application_per_hour;
    this.pollingInterval = pollingInterval;
    this.source_id = source_id ?? source_name
  }

  getMaxApplicationPerHour() {
    return this.max_application_per_hour;
  }

  async fetchJobs() {
    throw new Error("fetchJobs() must be implemented");
  }

  formatJobs(jobs) {
    throw new Error("formatJobs() must be implemented");
  }

  async getJobs() {
    throw new Error("getJobs() must be implemented");
  }
}
