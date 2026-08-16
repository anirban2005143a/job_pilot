export class JobSource {
  constructor(name, max_application_per_hour = 500) {
    this.name = name;
    this.max_application_per_hour = max_application_per_hour;
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