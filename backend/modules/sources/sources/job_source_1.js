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

  async _fetchJobs() {
    try {
      const response = await axios.get(`${this.base_url}/jobs`);

      return response.data.jobs;
    } catch (error) {
      if (error.response) {
        throw new Error(
          error.response.data?.error || "Failed to apply for job",
        );
      }
      throw error;
    }
  }

  /*
  return {
    application_id : (optional)/(required - if the checkStatus takes application id then its a required field),
    job_id: (reuired),
    user_id: (reuired),
    status: (required),
  }
  */
  async applyJob({ job_id, user_id, name, email, resume, cover_letter }) {
    try {
      const response = await axios.post(`${this.base_url}/apply`, {
        job_id,
        user_id,
        name,
        email,
        resume,
        cover_letter,
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(
          error.response.data?.error || "Failed to apply for job",
        );
      }

      throw error;
    }
  }

  _formatJobs(jobs) {
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
    const jobs = await this._fetchJobs();

    return this._formatJobs(jobs);
  }

  async checkStatus({ userId, jobId, application_id = "" }) {
    const response = await fetch(
      `${this.base_url}/check-status?user_id=${encodeURIComponent(userId)}&job_id=${encodeURIComponent(jobId)}`,
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch application status");
    }

    return data;
  }
}
