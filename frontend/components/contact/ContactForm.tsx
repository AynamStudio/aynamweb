"use client";

import { useState, type ChangeEvent, type FormEvent, type SelectHTMLAttributes } from "react";
import { BUDGET_RANGES, PROJECT_TYPES } from "@/lib/constants";
import TransitionLink from "@/components/motion/TransitionLink";
import { cn } from "@/lib/utils";

type Status = "idle" | "sending" | "success" | "error";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const INITIAL = {
  name: "",
  email: "",
  company: "",
  phone: "",
  projectType: "",
  budget: "",
  message: "",
  website: "", // honeypot — never visible to humans
};

const FIELD =
  "w-full border-b border-line bg-transparent py-3 text-sm text-fog outline-none transition-colors duration-300 placeholder:text-fog-muted/60 focus:border-fg/60";
const LABEL = "label-tech mb-1 block text-fog-muted";

function SelectField({
  label,
  className,
  ...rest
}: { label: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className={LABEL} htmlFor={rest.id}>
        {label}
      </label>
      <div className="relative">
        <select
          {...rest}
          className={cn(
            FIELD,
            "appearance-none pr-8",
            rest.value === "" && "text-fog-muted/70",
            className
          )}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-fog-muted"
        >
          ▼
        </span>
      </div>
    </div>
  );
}

export default function ContactForm() {
  const [values, setValues] = useState(INITIAL);
  const [status, setStatus] = useState<Status>("idle");
  const [sentName, setSentName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const busy = status === "sending";

  const set =
    (key: keyof typeof INITIAL) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return; // double-click guard
    setStatus("sending");
    try {
      const res = await fetch(`${API}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: { success?: boolean; errors?: Record<string, string> } | null = await res.json().catch(() => null);
      setErrors(data?.errors || {});
      if (res.ok && data?.success) {
        setSentName(values.name.trim().split(/\s+/)[0] || values.name.trim());
        setValues(INITIAL); // clear only on success
        setStatus("success");
      } else {
        setStatus("error"); // keep values so nothing is lost
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="border border-line px-6 py-14 text-center md:px-14 md:py-20">
        <span className="label-tech text-fog-muted">Message received</span>
        <h3 className="headline mt-6 text-[clamp(2rem,4vw,3.2rem)] text-fog">
          Thanks, {sentName}.
        </h3>
        <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-fog-dim md:text-base">
          We&apos;ve received your details. Our team will get back to you soon.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row">
          <TransitionLink
            href="/"
            className="rounded-full bg-fg px-8 py-3.5 text-sm font-medium text-ink-950 transition-colors duration-300 hover:bg-fg/90"
          >
            Back to AYNAM
          </TransitionLink>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="label-tech text-fog-muted transition-colors duration-300 hover:text-fog"
          >
            Send another message →
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2">
      {/* honeypot — hidden from humans, irresistible to bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label>
          Website
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={set("website")}
          />
        </label>
      </div>

      <div>
        <label className={LABEL} htmlFor="cf-name">
          Full Name <span aria-hidden="true">*</span>
        </label>
        <input
          id="cf-name"
          name="name"
          type="text"
          required
          maxLength={100}
          autoComplete="name"
          placeholder="Your name"
          className={FIELD}
          value={values.name}
          onChange={set("name")}
        />
      </div>

      <div>
        <label className={LABEL} htmlFor="cf-email">
          Email Address <span aria-hidden="true">*</span>
        </label>
        <input
          id="cf-email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="you@company.com"
          className={FIELD}
          value={values.email}
          onChange={set("email")}
        />
      </div>

      <div>
        <label className={LABEL} htmlFor="cf-company">
          Company / Organization
        </label>
        <input
          id="cf-company"
          name="company"
          type="text"
          maxLength={150}
          autoComplete="organization"
          placeholder="Optional"
          className={FIELD}
          value={values.company}
          onChange={set("company")}
        />
      </div>

      <div>
        <label className={LABEL} htmlFor="cf-phone">
          Phone Number
        </label>
        <input
          id="cf-phone"
          name="phone"
          type="tel"
          maxLength={20}
          autoComplete="tel"
          placeholder="Optional"
          className={FIELD}
          value={values.phone}
          onChange={set("phone")}
        />
      </div>

      <SelectField
        id="cf-project"
        name="projectType"
        label="Project Type"
        value={values.projectType}
        onChange={set("projectType")}
      >
        <option value="" className="bg-ink-950 text-fog">
          Select a project type
        </option>
        {PROJECT_TYPES.map((p) => (
          <option key={p} value={p} className="bg-ink-950 text-fog">
            {p}
          </option>
        ))}
      </SelectField>

      <SelectField
        id="cf-budget"
        name="budget"
        label="Budget Range"
        value={values.budget}
        onChange={set("budget")}
      >
        <option value="" className="bg-ink-950 text-fog">
          Select a budget range
        </option>
        {BUDGET_RANGES.map((b) => (
          <option key={b} value={b} className="bg-ink-950 text-fog">
            {b}
          </option>
        ))}
      </SelectField>

      <div className="md:col-span-2">
        <label className={LABEL} htmlFor="cf-message">
          Message <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="cf-message"
          name="message"
          required
          rows={5}
          maxLength={5000}
          placeholder="What are you building, and where does it hurt?"
          className={cn(FIELD, "resize-y leading-relaxed")}
          value={values.message}
          onChange={set("message")}
        />
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="md:col-span-2 border border-red-400/40 px-5 py-4" role="alert">
          <p className="label-tech text-red-500">Please fix the following</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-fog-dim">
            {Object.values(errors).map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-col gap-6 md:col-span-2 md:flex-row md:items-center md:justify-between">
        <button
          type="submit"
          disabled={busy}
          className={cn(
            "inline-flex items-center gap-2 self-start rounded-full bg-fg px-9 py-3.5 text-sm font-medium text-ink-950 transition-colors duration-300",
            busy ? "cursor-wait opacity-70" : "hover:bg-fg/90"
          )}
        >
          {busy ? "Sending…" : "Send Message →"}
        </button>
        <p aria-live="polite" className="text-xs leading-relaxed text-fog-muted">
          {status === "error" ? (
            <span role="alert" className="text-fog-dim">
              Something went wrong. Please try again.
            </span>
          ) : (
            "Required fields are marked *. We only use your details to respond."
          )}
        </p>
      </div>
    </form>
  );
}
