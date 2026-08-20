"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import { apiFetch } from "@/lib/api";
import { Button, Card, CardContent, CardHeader } from "@/components/ui";
import type {
  AppliedJob,
  AppliedJobDetail,
  Clarification,
  ClarificationDetail,
} from "@/lib/dashboard-types";

type Mode = "applied" | "clarifications";

export function JobSplitView({
  mode,
  onBack,
}: {
  mode: Mode;
  onBack: () => void;
}) {
  const [items, setItems] = useState<(AppliedJob | Clarification)[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<
    AppliedJobDetail | ClarificationDetail | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [confirming, setConfirming] = useState<"apply" | "reject" | null>(null);

  useEffect(() => {
    const endpoint =
      mode === "applied"
        ? "/api/dashboard/applied-jobs"
        : "/api/dashboard/clarifications";
    apiFetch<{ data: (AppliedJob | Clarification)[] }>(endpoint)
      .then((result) => {
        const nextItems = result.data ?? [];
        const requestedJobId = new URLSearchParams(window.location.search).get(
          "jobId",
        );
        setItems(nextItems);
        const requestedItem = requestedJobId
          ? nextItems.find((item) => item.jobId === requestedJobId)
          : undefined;
        setSelectedId(requestedItem?.jobId ?? nextItems[0]?.jobId ?? "");
      })
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : "Could not load jobs",
        ),
      )
      .finally(() => setLoading(false));
  }, [mode]);

  useEffect(() => {
    if (!selectedId) return;
    const endpoint =
      mode === "applied"
        ? `/api/dashboard/applied-jobs/${selectedId}`
        : `/api/dashboard/clarifications/${selectedId}`;
    let active = true;
    Promise.resolve()
      .then(() => {
        if (active) setDetailLoading(true);
      })
      .then(() =>
        apiFetch<{ data: AppliedJobDetail | ClarificationDetail }>(endpoint),
      )
      .then((result) => {
        if (active) setDetail(result.data);
      })
      .catch((error) => {
        if (active)
          toast.error(
            error instanceof Error
              ? error.message
              : "Could not load job details",
          );
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mode, selectedId]);

  async function confirmDecision() {
    if (!confirming || !selectedId) return;
    setDecisionLoading(true);
    try {
      await apiFetch("/api/user/job-decision", {
        method: "POST",
        body: { jobId: selectedId, decision: confirming },
      });
      toast.success(
        confirming === "apply" ? "Job sent to scheduler" : "Job rejected",
      );
      setItems((current) =>
        current.filter(
          (item) => (item as AppliedJob | Clarification).jobId !== selectedId,
        ),
      );
      setDetail(null);
      setConfirming(null);
      const next = items.find((item) => item.jobId !== selectedId);
      if (next) setSelectedId(next.jobId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not process decision",
      );
    } finally {
      setDecisionLoading(false);
    }
  }

  const selected = items.find((item) => item.jobId === selectedId);
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#f8fafc] text-[#172554]">
      <header className="shrink-0 border-b border-[#dbeafe] bg-white px-5 py-4 md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft size={18} /> Back
          </Button>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles size={16} className="text-[#2563eb]" />
            {mode === "applied" ? "Applied jobs" : "Needs clarification"}
          </div>
          <span className="text-xs text-[#6f7c75]">{items.length} total</span>
        </div>
      </header>
      <div className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 gap-5 overflow-hidden px-5 py-6 md:grid-cols-[320px_1fr] md:px-10">
        <aside className="min-h-0 overflow-y-auto rounded-xl border border-[#dbeafe] bg-white p-2">
          <div className="px-3 py-3">
            <h1 className="text-lg font-semibold">
              {mode === "applied" ? "Recent applications" : "Pending decisions"}
            </h1>
            <p className="mt-1 text-xs text-[#6f7c75]">
              Select an item to view its details.
            </p>
          </div>
          {loading ? (
            <Loading text="Loading list..." />
          ) : items.length === 0 ? (
            <Empty
              text={
                mode === "applied"
                  ? "No applied jobs yet."
                  : "No pending clarifications."
              }
            />
          ) : (
            <div className="space-y-1">
              {items.map((item) => (
                <button
                  key={item.jobId}
                  type="button"
                  onClick={() => setSelectedId(item.jobId)}
                  className={`w-full cursor-pointer rounded-lg px-3 py-3 text-left transition ${selectedId === item.jobId ? "bg-[#dbeafe]" : "hover:bg-[#f1f5f9]"}`}
                >
                  <div className="truncate text-sm font-semibold">
                    {item.title || "Untitled role"}
                  </div>
                  <div className="mt-1 truncate text-xs text-[#6f7c75]">
                    {item.company || "Unknown company"}
                  </div>
                  {"status" in item && (
                    <span
                      className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClasses(item.status)}`}
                    >
                      {item.status.replaceAll("_", " ")}
                    </span>
                  )}
                  {"match_score" in item && item.match_score != null && (
                    <div className="mt-2 text-[11px] font-bold text-[#2563eb]">
                      {item.match_score}% match
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </aside>
        <section className="min-h-0 overflow-y-auto pr-1">
          {detailLoading ? (
            <Card>
              <CardContent>
                <Loading text="Loading job details..." />
              </CardContent>
            </Card>
          ) : detail && selected ? (
            <DetailPanel
              mode={mode}
              item={selected}
              detail={detail}
              onDecision={setConfirming}
            />
          ) : (
            <Card>
              <CardContent>
                <Empty text="Select a job to see details." />
              </CardContent>
            </Card>
          )}
        </section>
      </div>
      {confirming && (
        <ConfirmDialog
          decision={confirming}
          loading={decisionLoading}
          onCancel={() => setConfirming(null)}
          onConfirm={confirmDecision}
        />
      )}
    </main>
  );
}

function DetailPanel({
  mode,
  item,
  detail,
  onDecision,
}: {
  mode: Mode;
  item: AppliedJob | Clarification;
  detail: AppliedJobDetail | ClarificationDetail;
  onDecision: (decision: "apply" | "reject") => void;
}) {
  const job = detail.job;
  const match = detail.match;
  const clarification = "clarification" in detail ? detail.clarification : null;
  const application = "application" in detail ? detail.application : null;
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              {application?.applied_at && (
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                  Applied {formatDetailDate(application.applied_at)}
                </p>
              )}
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#2563eb]">
                {mode === "applied"
                  ? "Application detail"
                  : "Clarification review"}
              </div>
              <h1 className="text-2xl font-semibold text-[#172554]">
                {job.title}
              </h1>
              <p className="mt-1 text-sm font-medium text-[#475569]">
                {job.company}
              </p>
              <p className="mt-3 flex items-center gap-1 text-xs text-[#64748b]">
                <MapPin size={14} />
                {[...(job.cities ?? []), ...(job.countries ?? [])].join(", ") ||
                  "Location not specified"}
              </p>
            </div>
            {match?.match_score != null && (
              <div className="rounded-xl bg-[#dbeafe] px-5 py-3 text-center">
                <div className="text-2xl font-semibold text-[#1d4ed8]">
                  {match.match_score}%
                </div>
                <div className="text-[10px] font-bold uppercase text-[#1d4ed8]">
                  Match
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Info
              label="Status"
              value={application?.status || "Pending review"}
            />
            <Info
              label="Workplace"
              value={
                [
                  job.is_remote && "Remote",
                  job.is_hybride && "Hybrid",
                  job.is_onsite && "Onsite",
                ]
                  .filter(Boolean)
                  .join(" / ") || "Not specified"
              }
            />
            <Info label="Salary" value={job.salary_offered || "Not listed"} />
            <Info
              label="Start date"
              value={
                job.start_date ? formatDetailDate(job.start_date) : "Not listed"
              }
            />

            <Info
              label="Visa sponsorship"
              value={String(job.visa_sponsorship_offered ?? "Not specified")}
            />
          </div>
        </CardContent>
      </Card>
      {normalizeList(job.required_skills).length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Required skills</h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {normalizeList(job.required_skills).map((skill, index) => (
                <span
                  className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-medium text-[#1d4ed8]"
                  key={`${index}-${String(skill)}`}
                >
                  {formatPoint(skill)}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {job.description && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Job description</h2>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-6 text-[#475569]">
              {job.description}
            </p>
          </CardContent>
        </Card>
      )}
      {match && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Match analysis</h2>
          </CardHeader>
          <CardContent>
            {match.reason && (
              <p className=" text-sm leading-6 text-[#475569]">
                {match.reason}
              </p>
            )}
            {match.matching_skills && (
              <ListBlock
                title="Matching skills"
                values={match.matching_skills}
              />
            )}
            {match.missing_or_unclear && (
              <ListBlock
                title="Missing or unclear"
                values={match.missing_or_unclear}
              />
            )}
            {match.critical_gaps && (
              <ListBlock title="Critical gaps" values={match.critical_gaps} />
            )}
            {match.future_work_experience && (
              <ListBlock
                title="Future work experience"
                values={match.future_work_experience}
              />
            )}
          </CardContent>
        </Card>
      )}
      {mode === "clarifications" && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Clarification</h2>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-6 text-[#475569]">
              {clarification?.summary ||
                (item as Clarification).summary ||
                "Please review this opportunity before deciding."}
            </p>
            {normalizeList(clarification?.clarification_points).length > 0 && (
              <ul className="mt-4 space-y-3 text-sm text-[#475569]">
                {normalizeList(clarification?.clarification_points).map(
                  (point, index) => (
                    <li
                      className="rounded-lg border border-[#dbeafe] bg-[#f8fafc] p-3"
                      key={`${index}-${formatPoint(point)}`}
                    >
                      {typeof point === "object" && point !== null ? (
                        <>
                          <h3 className="font-semibold text-[#172554]">
                            {String(
                              (point as { title?: unknown }).title ||
                                "Review point",
                            )}
                          </h3>
                          <p className="mt-1 leading-6">
                            {String(
                              (point as { summary?: unknown }).summary ||
                                "No additional details provided.",
                            )}
                          </p>
                        </>
                      ) : (
                        formatPoint(point)
                      )}
                    </li>
                  ),
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
      {application && mode === "applied" && (
        <>
          {application.resume && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">Resume</h2>
                    <p className="mt-1 text-xs text-[#64748b]">
                      Generated Markdown document
                    </p>
                  </div>
                  <DownloadButton
                    content={application.resume}
                    filename="resume.pdf"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <MarkdownDocument content={application.resume} />
              </CardContent>
            </Card>
          )}
          {application.cover_letter && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">Cover letter</h2>
                    <p className="mt-1 text-xs text-[#64748b]">
                      Generated Markdown document
                    </p>
                  </div>
                  <DownloadButton
                    content={application.cover_letter}
                    filename="cover-letter.pdf"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <MarkdownDocument content={application.cover_letter} />
              </CardContent>
            </Card>
          )}
        </>
      )}
      {mode === "clarifications" && (
        <div className="flex justify-end gap-3 border-t border-[#dbeafe] pt-5">
          <Button variant="outline" onClick={() => onDecision("reject")}>
            <AlertCircle size={16} /> Reject
          </Button>
          <Button variant="contained" onClick={() => onDecision("apply")}>
            <CheckCircle2 size={16} /> Apply
          </Button>
        </div>
      )}
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-[#6f7c75]">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
function Loading({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-8 text-sm text-[#64748b]">
      <LoaderCircle className="animate-spin text-[#2563eb]" size={18} />
      {text}
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="px-3 py-8 text-sm text-[#6f7c75]">{text}</div>;
}
function formatPoint(point: unknown) {
  if (typeof point === "string") return point;
  if (point && typeof point === "object")
    return Object.values(point as Record<string, unknown>)
      .filter((value) => value != null)
      .map(String)
      .join(" ");
  return String(point);
}
function formatDetailDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}
function ListBlock({ title, values }: { title: string; values: unknown }) {
  const list = normalizeList(values);
  if (list.length === 0) return null;
  return (
    <div className="mt-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#64748b]">
        {title}
      </h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#475569]">
        {list.map((value, index) => (
          <li key={`${index}-${formatPoint(value)}`}>{formatPoint(value)}</li>
        ))}
      </ul>
    </div>
  );
}
function MarkdownDocument({ content }: { content: string }) {
  return (
    <article className="markdown-body rounded-lg border border-[#dbeafe] p-5">
      <ReactMarkdown>{content}</ReactMarkdown>
    </article>
  );
}
function DownloadButton({
  content,
  filename,
}: {
  content: string;
  filename: string;
}) {
  function download() {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const lines = pdf.splitTextToSize(content.replace(/[#*_`>-]/g, ""), 520);
    let y = 48;
    lines.forEach((line: string) => {
      if (y > 780) {
        pdf.addPage();
        y = 48;
      }
      pdf.text(line, 40, y);
      y += 15;
    });
    pdf.save(filename);
  }
  return (
    <Button variant="outline" className="text-xs" onClick={download}>
      Download {filename.replace(".pdf", "")}
    </Button>
  );
}
function normalizeList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value == null || value === "") return [];
  if (typeof value === "string") return [value];
  if (typeof value === "object") return [value];
  return [value];
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
function ConfirmDialog({
  decision,
  loading,
  onCancel,
  onConfirm,
}: {
  decision: "apply" | "reject";
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#17255499] px-5">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
      >
        <h2 className="text-xl font-semibold">Confirm {decision}</h2>
        <p className="mt-2 text-sm text-[#6f7c75]">
          Do you want to {decision} this job?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={decision === "reject" ? "outline" : "contained"}
            onClick={onConfirm}
            disabled={loading}
            startIcon={
              loading ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : undefined
            }
          >
            {loading ? "Processing..." : `Yes, ${decision}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
