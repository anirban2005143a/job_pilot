"use client";

import { useRouter } from "next/navigation";
import { JobSplitView } from "@/components/JobSplitView";

export default function AppliedJobsPage() {
  const router = useRouter();
  return <JobSplitView mode="applied" onBack={() => router.push("/")} />;
}
