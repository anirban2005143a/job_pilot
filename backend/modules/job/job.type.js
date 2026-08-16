// job.js

class Job {
  constructor({
    id,
    title,
    company,
    cities,
    countries,
    is_remote,
    is_hybride,
    is_onsite,
    salary_offered,
    visa_sponsorship_offered,
    start_date,
    required_skills,
    description,
  }) {
    this.id = id;
    this.title = title;
    this.company = company;
    this.cities = cities;
    this.countries = countries;
    this.is_remote = is_remote;
    this.is_hybride = is_hybride;
    this.is_onsite = is_onsite;
    this.salary_offered = salary_offered;
    this.visa_sponsorship_offered = visa_sponsorship_offered;
    this.start_date = start_date;
    this.required_skills = required_skills;
    this.description = description;
  }
}

module.exports = {Job};