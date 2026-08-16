import axios from "axios";
import { JobSource } from "../JobSource.js";
import { Job } from "../../job/job.model.js";

export class JobSource1 extends JobSource {
  constructor() {
    super("Dummy Job Source");
    this.base_url = "http://localhost:4000"
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