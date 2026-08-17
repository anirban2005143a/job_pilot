import axios from "axios";
import { JobSource } from "../JobSource.js";
import { Job } from "../../job/job.type.js";

export class JobSource1 extends JobSource {
  constructor(
    sourceId,
    sourceName,
    base_url,
    max_application_per_hour,
    pollingInterval,
  ) {
    if (!sourceId) throw new Error("Job Source must provide a source id");
    if (!sourceName) throw new Error("Job Source must provide a source name");
    if (!base_url) throw new Error("Job Source must provide a base url");
    if (!max_application_per_hour)
      throw new Error(
        "Job Source must provide a maximum limit of submit application per hour.",
      );

    if (!pollingInterval)
      throw new Error(
        "Job Source must provide a time interval between two job polling.",
      );

    super(sourceName, max_application_per_hour, pollingInterval);

    this.sourceId = sourceId;
    this.base_url = base_url;
  }

  async fetchJobs() {
    const response = await axios.get(`${this.base_url}/jobs`);

    return response.data.jobs;
  }

  formatJobs(jobs) {
    return jobs.map(
      (job) =>
        new Job({
          id: job.id,
          title: job.title,
          company: job.company,
          cities: job.cities,
          countries: job.countries,
          is_remote: job.is_remote,
          is_hybride: job.is_hybride,
          is_onsite: job.is_onsite,
          salary_offered: job.salary_offered,
          visa_sponsorship_offered: job.visa_sponsorship_offered,
          start_date: job.start_date,
          required_skills: job.required_skills,
          description: job.description,
        }),
    );
  }

  async getJobs() {
    const jobs = await this.fetchJobs();

    return this.formatJobs(jobs);
  }
}
