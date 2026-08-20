"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, TextField } from "@/components/ui";
import { ArrowRight, BriefcaseBusiness, LoaderCircle } from "lucide-react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { apiFetch, saveToken } from "@/lib/api";
import { setUser } from "@/lib/store";
import type { User } from "@/lib/types";

export function LoginForm({ onComplete }: { onComplete: () => void }) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await apiFetch<{ token: string; user: User }>(
        "/api/auth/login",
        {
          method: "POST",
          body: { email, password },
          skip401: true,
        },
      );
      saveToken(result.token);
      const fullUser = await apiFetch<{ data: User }>("/api/dashboard/user");
      dispatch(setUser(fullUser.data));
      toast.success("Welcome back");
      onComplete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <div className="auth-layout">
        <aside className="intro">
          <Brand />
          <div className="intro-copy">
            <div className="eyebrow">WELCOME BACK</div>
            <h1>Your next move starts here.</h1>
            <p>
              Sign in to return to your profile, preferences, and job workspace.
            </p>
          </div>
        </aside>
        <section className="work-area">
          <div className="mobile-brand brand">
            <Brand />
          </div>
          <div className="auth-card">
            <div className="eyebrow">SIGN IN</div>
            <h2>Pick up where you left off.</h2>
            <p className="muted">Use your JobPilot account to continue.</p>
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
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <Link className="text-button" href="/signup">
              New to JobPilot? Create an account
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Brand() {
  return (
    <>
      <span className="brand-mark">
        <BriefcaseBusiness size={18} />
      </span>{" "}
      jobpilot
    </>
  );
}
