"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FileText, LoaderCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { SignupLayout } from "@/components/SignupLayout";
import { apiFetch } from "@/lib/api";

export default function UploadResumePage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  function chooseFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length > 5)
      return toast.error("Choose no more than 5 resumes.");
    if (
      selected.some(
        (file) =>
          file.type !== "application/pdf" || file.size > 5 * 1024 * 1024,
      )
    )
      return toast.error("Each resume must be a PDF under 5 MB.");
    setFiles(selected);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!files.length) return toast.error("Add at least one PDF resume.");
    setLoading(true);
    try {
      const form = new FormData();
      files.forEach((file) => form.append("resumes", file));
      await apiFetch("/api/user/upload-resume", { method: "POST", body: form });
      router.push("/signup/profile");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }
  return (
    <SignupLayout step={1}>
      <div className="auth-card">
        <div className="eyebrow">STEP 1 OF 3</div>
        <h2>Start with your resumes.</h2>
        <p className="muted">
          Upload up to five PDFs. Each file must be 5 MB or smaller.
        </p>
        <form onSubmit={submit} className="form-stack">
          <label className="dropzone">
            <FileText size={28} />
            <strong>Choose PDF resumes</strong>
            <span>Up to 5 files, 5 MB each</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              multiple
              onChange={chooseFiles}
            />
          </label>
          {files.map((file) => (
            <div className="file-row" key={file.name}>
              <FileText size={16} />
              <span>{file.name}</span>
              <button
                type="button"
                onClick={() => setFiles(files.filter((item) => item !== file))}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <Button
            type="submit"
            variant="contained"
            className="primary-button"
            disabled={loading || !files.length}
            startIcon={
              loading ? (
                <LoaderCircle className="animate-spin" size={17} />
              ) : undefined
            }
          >
            {loading ? "Uploading..." : "Upload and continue"}
          </Button>
        </form>
      </div>
    </SignupLayout>
  );
}
