export class JobSource {
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