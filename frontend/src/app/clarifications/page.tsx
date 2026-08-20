"use client";

import { useRouter } from "next/navigation";
import { JobSplitView } from "@/components/JobSplitView";

export default function ClarificationsPage() {
  const router = useRouter();
  return <JobSplitView mode="clarifications" onBack={() => router.push("/")} />;
}
