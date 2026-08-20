"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { LoaderCircle } from "lucide-react";
import { Button, TextField } from "@/components/ui";
import { SignupLayout } from "@/components/SignupLayout";
import { apiFetch } from "@/lib/api";

type Profile = {
  full_name: string;
  phone: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  max_applications_per_day: string;
};
const initialProfile: Profile = {
  full_name: "",
  phone: "",
  linkedin_url: "",
  github_url: "",
  portfolio_url: "",
  max_applications_per_day: "1000",
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    apiFetch<{ data: Partial<Profile> }>("/api/user/extract-user-info")
      .then((result) =>
        setProfile((current) => ({
          ...current,
          ...result.data,
          max_applications_per_day:
            result.data.max_applications_per_day == null
              ? current.max_applications_per_day
              : String(result.data.max_applications_per_day),
        })),
      )
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : "Could not extract profile",
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  function updateLimit(rawValue: string) {
    if (rawValue.startsWith("-")) {
      toast.error("Value not allowed. Minimum value is 1.");
      return;
    }
    const normalized = rawValue.replace(/^0+(?=\d)/, "");
    if (normalized && Number(normalized) < 1)
      toast.error("Value not allowed. Minimum value is 1.");
    setProfile((current) => ({
      ...current,
      max_applications_per_day: normalized,
    }));
  }
  function validateProfile() {
    if (!/^\d{10}$/.test(profile.phone.trim()))
      return "Phone number must be exactly 10 digits.";
    const limit = Number(profile.max_applications_per_day);
    if (
      !/^\d+$/.test(profile.max_applications_per_day) ||
      !Number.isInteger(limit) ||
      limit < 1
    )
      return "Maximum applications per day must be a whole number of at least 1.";
    for (const field of [
      "linkedin_url",
      "github_url",
      "portfolio_url",
    ] as const)
      if (profile[field].trim()) {
        try {
          new URL(profile[field]);
        } catch {
          return `${field.replace("_url", "")} must be a valid URL.`;
        }
      }
    return null;
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const validationError = validateProfile();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        full_name: profile.full_name.trim(),
        phone: profile.phone.trim(),
        max_applications_per_day: Number(profile.max_applications_per_day),
        ...Object.fromEntries(
          ["linkedin_url", "github_url", "portfolio_url"]
            .filter((field) => profile[field as keyof Profile].trim())
            .map((field) => [field, profile[field as keyof Profile].trim()]),
        ),
      };
      await apiFetch("/api/user/update/profile", {
        method: "PATCH",
        body: payload,
      });
      toast.success("Profile saved");
      router.push("/signup/preferences");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save profile",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <SignupLayout step={2}>
      <div className="auth-card">
        <div className="eyebrow">STEP 2 OF 3</div>
        <h2>Make the draft yours.</h2>
        <p className="muted">
          We extracted these fields from your resume. Review and update them
          before saving.
        </p>
        {loading ? (
          <p className="loading-message">
            <LoaderCircle className="animate-spin" size={18} /> Reading your
            resume...
          </p>
        ) : (
          <form onSubmit={submit} className="form-stack">
            <div className="field-grid">
              {(
                [
                  ["full_name", "Full name"],
                  ["phone", "Phone"],
                  ["linkedin_url", "LinkedIn URL"],
                  ["github_url", "GitHub URL"],
                  ["portfolio_url", "Portfolio URL"],
                ] as const
              ).map(([field, label]) => (
                <TextField
                  key={field}
                  label={label}
                  value={profile[field]}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                  required={field === "full_name"}
                  placeholder={
                    field === "phone" ? "10-digit phone number" : label
                  }
                  fullWidth
                  size="small"
                />
              ))}
              <TextField
                label="Maximum applications per day"
                type="text"
                inputMode="numeric"
                value={profile.max_applications_per_day}
                onChange={(event) => updateLimit(String(event.target.value))}
                helperText="Default: 1000 · Minimum: 1"
                inputProps={{ minLength: 1 }}
                fullWidth
                size="small"
              />
            </div>
            <Button
              type="submit"
              variant="contained"
              className="primary-button"
              disabled={saving}
              startIcon={
                saving ? (
                  <LoaderCircle className="animate-spin" size={17} />
                ) : undefined
              }
            >
              {saving ? "Saving profile..." : "Save and continue"}
            </Button>
          </form>
        )}
      </div>
    </SignupLayout>
  );
}
