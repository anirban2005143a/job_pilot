export type AppliedJob = {
  applicationId: string;
  jobId: string;
  title: string;
  company: string;
  cities?: string[];
  countries?: string[];
  status: string;
  applied_at?: string;
  match_score?: number;
  matching_skills?: string[];
  reason?: string;
};

export type JobDetail = {
  job: {
    id: string;
    sourceId?: string;
    externalJobId?: string;
    title: string;
    company: string;
    cities?: string[];
    countries?: string[];
    description?: string;
    required_skills?: string[];
    salary_offered?: string;
    visa_sponsorship_offered?: boolean | string;
    start_date?: string;
    is_remote?: boolean;
    is_hybride?: boolean;
    is_onsite?: boolean;
  };
  match: {
    result?: string;
    match_score?: number;
    matching_skills?: string[];
    missing_or_unclear?: string[];
    critical_gaps?: string[];
    reason?: string;
    future_work_experience?: string[];
  } | null;
};

export type AppliedJobDetail = JobDetail & {
  application: {
    id: string;
    status: string;
    applied_at?: string;
    resume?: string;
    cover_letter?: string;
    response?: unknown;
  };
};

export type Clarification = {
  clarificationId: string;
  jobId: string;
  title: string;
  company: string;
  cities?: string[];
  countries?: string[];
  summary?: string;
  clarification_points?: (ClarificationPoint | string)[];
  createdAt?: string;
  match_score?: number;
};

export type ClarificationPoint = {
  title: string;
  summary: string;
};

export type ClarificationDetail = JobDetail & {
  clarification: {
    id: string;
    summary?: string;
    clarification_points?: (ClarificationPoint | string)[];
    createdAt?: string;
    updatedAt?: string;
  };
};
