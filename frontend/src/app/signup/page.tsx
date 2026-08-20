"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button, TextField } from "@/components/ui";
import { SignupLayout } from "@/components/SignupLayout";
import { apiFetch, saveToken } from "@/lib/api";
import type { User } from "@/lib/types";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await apiFetch<{ token: string; user: User }>(
        "/api/auth/register",
        { method: "POST", body: { email, password }, skip401: true },
      );
      saveToken(result.token);
      toast.success("Account created");
      router.push("/signup/upload-resume");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create account",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <SignupLayout step={0}>
      <div className="auth-card">
        <div className="eyebrow">START HERE</div>
        <h2>Build your career profile.</h2>
        <p className="muted">
          Create an account and we’ll guide you through the essentials.
        </p>
        <form onSubmit={submit} className="form-stack">
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            fullWidth
            size="small"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            fullWidth
            size="small"
            helperText="At least 6 characters"
            inputProps={{ minLength: 6 }}
          />
          <Button
            type="submit"
            variant="contained"
            className="primary-button"
            disabled={loading}
            startIcon={
              loading ? (
                <LoaderCircle className="animate-spin" size={17} />
              ) : undefined
            }
            endIcon={!loading && <ArrowRight size={18} />}
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <Link className="text-button" href="/login">
          Already have an account? Sign in
        </Link>
      </div>
    </SignupLayout>
  );
}
