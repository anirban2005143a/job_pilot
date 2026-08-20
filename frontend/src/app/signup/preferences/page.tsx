"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { Button, TextField } from "@/components/ui";
import { SignupLayout } from "@/components/SignupLayout";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";
import type { Preferences } from "@/lib/types";

const blank: Preferences = {
  notice_period: "",
  start_date: null,
  relocation_openness: "",
  employment_status: "",
  has_visa: "",
  visa_type: "",
  visa_countries: [],
  work_authorization_in_current_country: "",
  sponsorship_requirement: "",
  primary_languages: [],
  role_experience: [],
  work_mode: [],
  city_preference: [],
  country_preference: [],
  company_preference: "",
  minimum_salary: 0,
  customer_preference: "",
};
const emptyLanguage = { language: "", proficiency: "" };
const emptyRole = { role: "", years: "0" };

export default function PreferencesPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState(blank);
  const [salary, setSalary] = useState("");
  const [languages, setLanguages] = useState([{ ...emptyLanguage }]);
  const [roles, setRoles] = useState([{ ...emptyRole }]);
  const [visaCountries, setVisaCountries] = useState("");
  const [cities, setCities] = useState("");
  const [countries, setCountries] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: keyof Preferences, value: unknown) =>
    setPreferences((current) => ({ ...current, [field]: value }));
  const updateNumber = (
    raw: string,
    setter: (value: string) => void,
    label: string,
  ) => {
    if (!/^\d*$/.test(raw)) {
      toast.error(`${label} must be a number.`);
      return;
    }
    setter(raw.replace(/^0+(?=\d)/, ""));
  };
  const csv = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  const toggleWorkMode = (mode: "Remote" | "Hybrid" | "Onsite") =>
    update(
      "work_mode",
      preferences.work_mode.includes(mode)
        ? preferences.work_mode.filter((item) => item !== mode)
        : [...preferences.work_mode, mode],
    );
  const addLanguage = () =>
    languages.length >= 10
      ? toast.error("You can add a maximum of 10 languages.")
      : setLanguages([...languages, { ...emptyLanguage }]);
  const addRole = () =>
    roles.length >= 10
      ? toast.error("You can add a maximum of 10 roles.")
      : setRoles([...roles, { ...emptyRole }]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const selectedLanguages = languages.filter(
      (item) => item.language.trim() || item.proficiency,
    );
    const selectedRoles = roles.filter(
      (item) => item.role.trim() || item.years,
    );
    if (
      selectedLanguages.some(
        (item) => !item.language.trim() || !item.proficiency,
      )
    )
      return toast.error("Complete each language and proficiency.");
    if (
      selectedRoles.some(
        (item) =>
          !item.role.trim() ||
          !/^\d+$/.test(item.years) ||
          Number(item.years) > 50,
      )
    )
      return toast.error("Complete each role and use 0 to 50 years.");
    if (
      csv(visaCountries).length > 10 ||
      csv(cities).length > 10 ||
      csv(countries).length > 10
    )
      return toast.error("You can specify a maximum of 10 items in each list.");
    setLoading(true);
    try {
      const payload: Preferences = {
        ...preferences,
        start_date: preferences.start_date || null,
        visa_countries: csv(visaCountries),
        city_preference: csv(cities),
        country_preference: csv(countries),
        primary_languages: selectedLanguages,
        role_experience: selectedRoles.map((item) => ({
          role: item.role,
          years: Number(item.years),
        })),
        minimum_salary: salary === "" ? 0 : Number(salary),
      };
      await apiFetch("/api/user/upsert-preference", {
        method: "POST",
        body: { preferences: payload },
      });
      toast.success("Preferences saved");
      router.replace("/");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save preferences",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SignupLayout step={3}>
      <div className="auth-card preference-card">
        <div className="eyebrow">STEP 3 OF 3</div>
        <h2>Tell us what fits.</h2>
        <p className="muted">
          Every preference is optional. These details help shape better
          opportunities.
        </p>
        <form onSubmit={submit} className="form-stack">
          <div className="field-grid">
            <PreferenceSelect
              label="Employment status"
              value={preferences.employment_status}
              options={[
                "currently_working",
                "actively_looking",
                "open_to_offers",
                "just_browsing",
              ]}
              onChange={(value) => update("employment_status", value)}
            />
            <PreferenceSelect
              label="Relocation openness"
              value={preferences.relocation_openness}
              options={["yes", "no", "negotiable"]}
              onChange={(value) => update("relocation_openness", value)}
            />
            <PreferenceSelect
              label="Work authorization"
              value={preferences.work_authorization_in_current_country}
              options={["yes", "no"]}
              onChange={(value) =>
                update("work_authorization_in_current_country", value)
              }
            />
            <PreferenceSelect
              label="Sponsorship requirement"
              value={preferences.sponsorship_requirement}
              options={["no", "yes_now", "yes_future", "maybe"]}
              onChange={(value) => update("sponsorship_requirement", value)}
            />
          </div>
          <div className="field-grid">
            <TextField
              label="Notice period"
              value={preferences.notice_period}
              onChange={(event) => update("notice_period", event.target.value)}
              placeholder="e.g. 30 days"
            />
            <TextField
              label="Start date"
              type="date"
              value={preferences.start_date ?? ""}
              onChange={(event) =>
                update("start_date", event.target.value || null)
              }
            />
          </div>
          <div className="field-grid">
            <PreferenceSelect
              label="Do you have a visa?"
              value={preferences.has_visa}
              options={["yes", "no"]}
              onChange={(value) => update("has_visa", value)}
            />
            <TextField
              label="Visa type"
              value={preferences.visa_type}
              onChange={(event) => update("visa_type", event.target.value)}
              placeholder="e.g. H-1B"
            />
          </div>
          <label>
            Work modes
            <div className="choice-row">
              {(["Remote", "Hybrid", "Onsite"] as const).map((mode) => (
                <button
                  type="button"
                  className={
                    preferences.work_mode.includes(mode)
                      ? "choice active"
                      : "choice"
                  }
                  key={mode}
                  onClick={() => toggleWorkMode(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
          </label>
          <TextField
            label="Visa countries"
            value={visaCountries}
            onChange={(event) => setVisaCountries(event.target.value)}
            placeholder="Comma-separated countries"
          />
          <TextField
            label="Cities"
            value={cities}
            onChange={(event) => setCities(event.target.value)}
            placeholder="Comma-separated cities"
          />
          <TextField
            label="Countries"
            value={countries}
            onChange={(event) => setCountries(event.target.value)}
            placeholder="Comma-separated countries"
          />
          <TextField
            label="Company preference"
            value={preferences.company_preference}
            onChange={(event) =>
              update("company_preference", event.target.value)
            }
            placeholder="Companies or company types"
          />
          <TextField
            label="Minimum salary"
            type="text"
            inputMode="numeric"
            value={salary}
            onChange={(event) =>
              updateNumber(event.target.value, setSalary, "Minimum salary")
            }
          />
          <DynamicRows
            title="Primary languages"
            buttonLabel="Add language"
            onAdd={addLanguage}
          >
            {languages.map((item, index) => (
              <div className="dynamic-row" key={index}>
                <TextField
                  label="Language"
                  value={item.language}
                  onChange={(event) =>
                    setLanguages(
                      languages.map((current, row) =>
                        row === index
                          ? { ...current, language: event.target.value }
                          : current,
                      ),
                    )
                  }
                />
                <PreferenceSelect
                  label="Proficiency"
                  value={item.proficiency}
                  options={[
                    "Native",
                    "Fluent",
                    "Professional",
                    "Conversational",
                    "Beginner",
                  ]}
                  onChange={(value) =>
                    setLanguages(
                      languages.map((current, row) =>
                        row === index
                          ? { ...current, proficiency: value }
                          : current,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() =>
                    setLanguages(languages.filter((_, row) => row !== index))
                  }
                  title="Remove language"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </DynamicRows>
          <DynamicRows
            title="Role experience"
            buttonLabel="Add role"
            onAdd={addRole}
          >
            {roles.map((item, index) => (
              <div className="dynamic-row" key={index}>
                <TextField
                  label="Role"
                  value={item.role}
                  onChange={(event) =>
                    setRoles(
                      roles.map((current, row) =>
                        row === index
                          ? { ...current, role: event.target.value }
                          : current,
                      ),
                    )
                  }
                />
                <TextField
                  label="Years"
                  type="text"
                  inputMode="numeric"
                  value={item.years}
                  onChange={(event) =>
                    updateNumber(
                      event.target.value,
                      (value) =>
                        setRoles(
                          roles.map((current, row) =>
                            row === index
                              ? { ...current, years: value }
                              : current,
                          ),
                        ),
                      "Years of experience",
                    )
                  }
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() =>
                    setRoles(roles.filter((_, row) => row !== index))
                  }
                  title="Remove role"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </DynamicRows>
          <TextField
            label="Your preferences"
            value={preferences.customer_preference}
            onChange={(event) =>
              update("customer_preference", event.target.value)
            }
            multiline
            rows={3}
            placeholder="Anything else we should know?"
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
          >
            {loading ? "Saving preferences..." : "Finish setup"}
          </Button>
        </form>
      </div>
    </SignupLayout>
  );
}

function DynamicRows({
  title,
  buttonLabel,
  onAdd,
  children,
}: {
  title: string;
  buttonLabel: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="dynamic-section">
      <div className="dynamic-heading">
        <strong>{title}</strong>
        <button type="button" className="add-button" onClick={onAdd}>
          <Plus size={15} /> {buttonLabel}
        </button>
      </div>
      {children}
    </section>
  );
}
function PreferenceSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <Select.Root value={value} onValueChange={onChange}>
        <Select.Trigger className="select-trigger">
          <Select.Value placeholder="Choose one" />
          <ChevronDown size={16} />
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="select-content">
            <Select.Viewport>
              {options.map((option) => (
                <Select.Item
                  className="select-item"
                  value={option}
                  key={option}
                >
                  <Select.ItemText>
                    {option.replaceAll("_", " ")}
                  </Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </label>
  );
}
