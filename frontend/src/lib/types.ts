export type User = {
  _id?: string;
  id?: string;
  email: string;
  full_name?: string;
  phone?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  resumes?: string[];
  status?: "active" | "paused";
  max_applications_per_day?: number;
  applications_today?: number;
  applications_today_reset_at?: string;
  summary?: string;
  createdAt?: string;
  updatedAt?: string;
  preferences?: Preferences;
};

export type Preferences = {
  notice_period: string;
  start_date: string | null;
  relocation_openness: string;
  employment_status: string;
  has_visa: string;
  visa_type: string;
  visa_countries: string[];
  work_authorization_in_current_country: string;
  sponsorship_requirement: string;
  primary_languages: { language: string; proficiency: string }[];
  role_experience: { role: string; years: number }[];
  work_mode: ("Remote" | "Hybrid" | "Onsite")[];
  city_preference: string[];
  country_preference: string[];
  company_preference: string;
  minimum_salary: number;
  customer_preference: string;
};
