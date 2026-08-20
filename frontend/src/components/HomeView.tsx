"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  LogOut,
  Pause,
  Play,
  Sparkles,
  Target,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { setUser } from "@/lib/store";
import { Button, Card, CardContent, CardHeader } from "@/components/ui";
import type { User } from "@/lib/types";

type AppliedJob = {
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
type Clarification = {
  clarificationId: string;
  jobId: string;
  title: string;
  company: string;
  summary?: string;
  clarification_points?: string[];
  createdAt?: string;
  match_score?: number;
};

export function HomeView({
  user,
  onLogout,
  resumeCount,
}: {
  user: User;
  onLogout: () => void;
  resumeCount: number;
}) {
  const dispatch = useDispatch();
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);
  const [clarifications, setClarifications] = useState<Clarification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<{ data: AppliedJob[] }>("/api/dashboard/applied-jobs"),
      apiFetch<{ data: Clarification[] }>("/api/dashboard/clarifications"),
    ])
      .then(([jobs, pending]) => {
        if (active) {
          setAppliedJobs(
            [...(jobs.data ?? [])].sort(sortByRecentApplication),
          );
          setClarifications(
            [...(pending.data ?? [])].sort(sortByRecentClarification),
          );
        }
      })
      .catch((error) => {
        if (active)
          toast.error(
            error instanceof Error
              ? error.message
              : "Could not load dashboard data",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function toggleStatus() {
    const nextStatus = user.status === "active" ? "paused" : "active";
    setStatusLoading(true);
    try {
      const result = await apiFetch<{ status: "active" | "paused" }>(
        "/api/user/update/status",
        { method: "PATCH", body: { status: nextStatus } },
      );
      dispatch(setUser({ ...user, status: result.status }));
      toast.success(
        result.status === "active" ? "Automation started" : "Automation paused",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update automation status",
      );
    } finally {
      setStatusLoading(false);
    }
  }

  const active = user.status === "active";
  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#172554]">
      <header className="sticky top-0 z-10 border-b border-[#dbeafe] bg-white/95 px-5 py-4 backdrop-blur md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3 text-xl font-bold">
            <span className="grid size-9 place-items-center rounded-lg bg-[#dbeafe] text-[#2563eb]">
              <BriefcaseBusiness size={18} />
            </span>
            jobpilot
          </div>
          <Button
            variant="ghost"
            className="px-3! py-2!"
            onClick={onLogout}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 md:px-10 md:py-10">
        <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[#2563eb]">
              <Sparkles size={15} />
              Career dashboard
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Good to have you, {user.full_name || user.email.split("@")[0]}.
            </h1>
            <p className="mt-2 text-sm text-[#6f7c75]">
              Your job search, profile, and automation at a glance.
            </p>
          </div>
          <Button
            variant="contained"
            onClick={toggleStatus}
            disabled={statusLoading}
            startIcon={
              statusLoading ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : active ? (
                <Pause size={16} />
              ) : (
                <Play size={16} />
              )
            }
          >
            {statusLoading
              ? "Updating..."
              : active
                ? "Pause automation"
                : "Start automation"}
          </Button>
        </section>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            icon={<FileText size={18} />}
            label="Resumes"
            value={user.resumes?.length ?? resumeCount}
          />
          <Metric
            icon={<Target size={18} />}
            label="Applied jobs"
            value={appliedJobs.length}
          />
          <Metric
            icon={<Clock3 size={18} />}
            label="Needs attention"
            value={clarifications.length}
          />
          <Metric
            icon={active ? <Play size={18} /> : <Pause size={18} />}
            label="Daily application limit"
            value={user.max_applications_per_day ?? 1000}
          />
        </section>
        <section className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Applied jobs</h2>
                  <p className="mt-1 text-xs text-[#6f7c75]">
                    {appliedJobs.length === 0
                      ? "No recent applications"
                      : `Showing ${Math.min(appliedJobs.length, 5)} of ${appliedJobs.length} application${appliedJobs.length === 1 ? "" : "s"}`}
                  </p>
                </div>
                <Link
                  className="text-xs font-bold text-[#2563eb] hover:underline"
                  href="/applied-jobs"
                >
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingText text="Loading applied jobs..." />
              ) : appliedJobs.length === 0 ? (
                <EmptyState
                  icon={<FileText size={22} />}
                  text="No applications yet."
                />
              ) : (
                <div className="max-h-112 overflow-y-auto pr-2">
                  <div className="divide-y divide-[#edf1ed]">
                  {appliedJobs.slice(0, 5).map((job) => {
                    return (
                      <Link
                        href={`/applied-jobs?jobId=${encodeURIComponent(job.jobId)}`}
                        className="flex w-full flex-col gap-3 py-4 text-left transition-colors hover:bg-[#f8fafc] sm:flex-row sm:items-start sm:justify-between"
                        key={job.applicationId}
                      >
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-[#172554]">
                              {job.title || "Untitled role"}
                            </h3>
                            <p className="mt-1 text-sm font-medium text-[#516158]">
                              {job.company || "Unknown company"}
                            </p>
                            <p className="mt-1 text-xs text-[#7b8780]">
                              {[
                                ...(job.cities ?? []),
                                ...(job.countries ?? []),
                              ].join(", ") || "Location not specified"}
                              {job.applied_at &&
                                ` · Applied ${formatDate(job.applied_at)}`}
                            </p>
                            {job.reason && (
                              <p className="mt-2 line-clamp-1 text-xs leading-5 text-[#6f7c75]">
                                {job.reason}
                              </p>
                            )}
                            {job.matching_skills &&
                              job.matching_skills.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {job.matching_skills
                                    .slice(0, 3)
                                    .map((skill) => (
                                      <span
                                        className="rounded-full bg-[#eff6ff] px-2 py-0.5 text-[11px] text-[#2563eb]"
                                        key={skill}
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                </div>
                              )}
                          </div>
                          <div className="flex shrink-0 items-center gap-3 text-xs">
                            <span
                              className={`rounded-full px-2.5 py-1 capitalize ${statusClasses(job.status)}`}
                            >
                              {job.status.replaceAll("_", " ")}
                            </span>
                            {job.match_score != null && (
                              <strong className="text-[#2563eb]">
                                {job.match_score}% match
                              </strong>
                            )}
                          </div>
                      </Link>
                    );
                  })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="text-[#2563eb]" size={18} />
                  <div>
                    <h2 className="font-semibold">Needs clarification</h2>
                    <p className="mt-1 text-xs text-[#6f7c75]">
                      {clarifications.length === 0
                        ? "No decisions waiting"
                        : `${clarifications.length} decision${clarifications.length === 1 ? "" : "s"} waiting${clarifications.length > 5 ? " · Showing 5" : ""}`}
                    </p>
                  </div>
                </div>
                <Link
                  className="text-xs font-bold text-[#2563eb] hover:underline"
                  href="/clarifications"
                >
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingText text="Loading clarifications..." />
              ) : clarifications.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 size={22} />}
                  text="Nothing needs your attention."
                />
              ) : (
                <div className="max-h-112 space-y-4 overflow-y-auto pr-2">
                  {clarifications.slice(0, 5).map((item) => (
                    <Link
                      href={`/clarifications?jobId=${encodeURIComponent(item.jobId)}`}
                      className="block rounded-lg border border-[#dbeafe] bg-[#f8fafc] p-3 transition-colors hover:bg-[#eff6ff]"
                      key={item.clarificationId}
                    >
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-[#6f7c75]">{item.company}</p>
                      {item.summary && (
                        <p className="mt-2 line-clamp-2 text-xs text-[#516158]">
                          {item.summary}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Profile snapshot</h2>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Email" value={user.email} />
              <Info
                label="Status"
                value={active ? "Automation active" : "Automation paused"}
              />

              <Info
                label="Applications today"
                value={String(user.applications_today ?? 0)}
              />
              <Info
                label="Daily limit"
                value={String(user.max_applications_per_day ?? 1000)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="border-0">
      <CardContent>
        <div className="mb-4 grid size-9 place-items-center rounded-lg bg-[#dbeafe] text-[#2563eb]">
          {icon}
        </div>
        <div className="text-2xl font-semibold">{value}</div>
        <div className="mt-1 text-xs uppercase tracking-wide text-[#6f7c75]">
          {label}
        </div>
      </CardContent>
    </Card>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-[#6f7c75]">
        {label}
      </div>
      <div className="mt-1 truncate font-medium">{value}</div>
    </div>
  );
}
function LoadingText({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-[#6f7c75]">
      <LoaderCircle className="animate-spin text-[#2563eb]" size={18} />
      {text}
    </div>
  );
}
function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-[#6f7c75]">
      {icon}
      {text}
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "recently"
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function sortByRecentApplication(left: AppliedJob, right: AppliedJob) {
  return getTimestamp(right.applied_at) - getTimestamp(left.applied_at);
}

function sortByRecentClarification(
  left: Clarification,
  right: Clarification,
) {
  return getTimestamp(right.createdAt) - getTimestamp(left.createdAt);
}

function getTimestamp(value?: string) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function statusClasses(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("reject") || normalized.includes("fail"))
    return "bg-[#fee9e7] text-[#b42318]";
  if (
    normalized.includes("accept") ||
    normalized.includes("success") ||
    normalized.includes("schedul")
  )
    return "bg-[#dbeafe] text-[#1d4ed8]";
  return "bg-[#fff2d9] text-[#9a6700]";
}
