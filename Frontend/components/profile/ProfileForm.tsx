"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, updateUserProfile } from "@/lib/api";
import {
  formatLongDate,
  isUnsetDate,
  toDateInputValue,
} from "@/lib/format";
import type { UserProfileResponse } from "@/lib/types";
import { SpinnerIcon } from "../icons";
import { Toast } from "./Toast";

const BIO_MAX = 500;
const BIO_WARN = 450;

const labelClass =
  "mb-2 block font-mono text-[12px] font-medium uppercase tracking-[0.05em] text-white/60";

function inputClass(invalid: boolean): string {
  return [
    "w-full rounded border bg-[#121214] px-3 py-2.5 text-sm text-on-surface",
    "placeholder:text-muted focus:outline-none focus:ring-2 disabled:opacity-50",
    invalid
      ? "border-error focus:border-error focus:ring-error/10"
      : "border-white/10 focus:border-secondary-container focus:ring-secondary-container/10",
  ].join(" ");
}

type SaveError =
  | { kind: "none" }
  | { kind: "notfound" }
  | { kind: "retry" };

function validateName(value: string, label: string): string | null {
  const t = value.trim();
  if (t.length === 0) return `${label} is required.`;
  if (t.length > 50) return `${label} must be 50 characters or fewer.`;
  return null;
}

function validateBirthDate(value: string): string | null {
  if (!value) return "Birth date is required.";
  const d = new Date(`${value}T00:00:00`);
  if (isNaN(d.getTime())) return "Enter a valid date.";
  const now = new Date();
  if (d > now) return "Birth date can't be in the future.";
  if (d.getFullYear() < 1900) return "Birth date must be after 1900.";
  const thirteenYearsAgo = new Date(
    now.getFullYear() - 13,
    now.getMonth(),
    now.getDate(),
  );
  if (d > thirteenYearsAgo) return "You must be at least 13 years old.";
  return null;
}

interface Fields {
  firstName: string;
  lastName: string;
  bio: string;
  birthDate: string; // "YYYY-MM-DD" — only meaningful when birth date is editable
}

export function ProfileForm({
  userId,
  profile,
  onDirtyChange,
}: {
  userId: string;
  profile: UserProfileResponse;
  onDirtyChange: (dirty: boolean) => void;
}) {
  // Birth date is read-only once it has ever been set (a never-set value comes back
  // as the .NET DateTime default). This is enforced purely in the UI.
  const birthDateLocked = !isUnsetDate(profile.birth_date);

  const initial: Fields = {
    firstName: profile.first_name ?? "",
    lastName: profile.last_name ?? "",
    bio: profile.bio ?? "",
    birthDate: birthDateLocked ? "" : "",
  };

  const [saved, setSaved] = useState<Fields>(initial);
  const [fields, setFields] = useState<Fields>(initial);
  const [touched, setTouched] = useState<Record<keyof Fields, boolean>>({
    firstName: false,
    lastName: false,
    bio: false,
    birthDate: false,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<SaveError>({ kind: "none" });
  const [showToast, setShowToast] = useState(false);

  const statusRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const errors = {
    firstName: validateName(fields.firstName, "First name"),
    lastName: validateName(fields.lastName, "Last name"),
    bio: fields.bio.length > BIO_MAX ? `Bio must be ${BIO_MAX} characters or fewer.` : null,
    birthDate: birthDateLocked ? null : validateBirthDate(fields.birthDate),
  };
  const isValid = !errors.firstName && !errors.lastName && !errors.bio && !errors.birthDate;

  const isDirty =
    fields.firstName !== saved.firstName ||
    fields.lastName !== saved.lastName ||
    fields.bio !== saved.bio ||
    fields.birthDate !== saved.birthDate;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }
  function markTouched(key: keyof Fields) {
    setTouched((t) => ({ ...t, [key]: true }));
  }

  function revert() {
    setFields(saved);
    setTouched({ firstName: false, lastName: false, bio: false, birthDate: false });
    setSaveError({ kind: "none" });
  }

  async function save() {
    setTouched({ firstName: true, lastName: true, bio: true, birthDate: true });
    if (!isValid || saving) return;

    setSaving(true);
    setSaveError({ kind: "none" });

    // Send the full DTO: the backend maps the whole object onto the entity, so omitting
    // a field would blank it. Birth date stays the original ISO when it's locked.
    const body = {
      first_name: fields.firstName.trim(),
      last_name: fields.lastName.trim(),
      bio: fields.bio,
      birth_date: birthDateLocked
        ? profile.birth_date
        : `${fields.birthDate}T00:00:00`,
    };

    try {
      await updateUserProfile(userId, body);
      setSaved(fields); // new last-saved snapshot -> clears dirty
      setShowToast(true);
      // Let SR users know it worked.
      requestAnimationFrame(() => statusRef.current?.focus());
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setSaveError({ kind: "notfound" });
      } else {
        // 401 is handled inside authedFetch (refresh/login); anything else is a retry.
        setSaveError({ kind: "retry" });
      }
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setSaving(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void save();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      void save();
    } else if (e.key === "Escape" && isDirty) {
      e.preventDefault();
      if (window.confirm("Discard your unsaved changes?")) revert();
    }
  }

  const bioLen = fields.bio.length;
  const bioCounterClass =
    bioLen > BIO_MAX ? "text-error" : bioLen >= BIO_WARN ? "text-[#f5b54a]" : "text-muted";

  const showError = (key: keyof Fields) => touched[key] && errors[key];

  return (
    <form
      onSubmit={onSubmit}
      onKeyDown={onKeyDown}
      noValidate
      className="card-glow rounded-[var(--radius-card)] p-6 sm:p-8"
    >
      {saveError.kind === "notfound" && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mb-6 rounded border border-error/40 bg-error-container/20 px-4 py-3 text-sm text-error focus:outline-none"
        >
          Profile not found.
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <div>
          <label htmlFor="first-name" className={labelClass}>
            First Name
          </label>
          <input
            id="first-name"
            type="text"
            value={fields.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            onBlur={() => markTouched("firstName")}
            disabled={saving}
            maxLength={50}
            aria-invalid={showError("firstName") ? true : undefined}
            aria-describedby={showError("firstName") ? "first-name-error" : undefined}
            className={inputClass(!!showError("firstName"))}
          />
          {showError("firstName") && (
            <p id="first-name-error" className="mt-1.5 text-xs text-error">
              {errors.firstName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="last-name" className={labelClass}>
            Last Name
          </label>
          <input
            id="last-name"
            type="text"
            value={fields.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            onBlur={() => markTouched("lastName")}
            disabled={saving}
            maxLength={50}
            aria-invalid={showError("lastName") ? true : undefined}
            aria-describedby={showError("lastName") ? "last-name-error" : undefined}
            className={inputClass(!!showError("lastName"))}
          />
          {showError("lastName") && (
            <p id="last-name-error" className="mt-1.5 text-xs text-error">
              {errors.lastName}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="bio" className={labelClass}>
            Bio
          </label>
          <div className="relative">
            <textarea
              id="bio"
              value={fields.bio}
              onChange={(e) => set("bio", e.target.value)}
              onBlur={() => markTouched("bio")}
              disabled={saving}
              rows={4}
              aria-invalid={errors.bio ? true : undefined}
              aria-describedby="bio-counter"
              className={`${inputClass(!!errors.bio)} resize-y pb-7`}
            />
            <span
              id="bio-counter"
              className={`pointer-events-none absolute bottom-2.5 right-3 text-[11px] tabular-nums ${bioCounterClass}`}
            >
              {bioLen} / {BIO_MAX}
            </span>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="birth-date" className={labelClass}>
            Birth Date
          </label>
          {birthDateLocked ? (
            <div>
              <p className="text-sm text-on-surface">
                {formatLongDate(profile.birth_date)}
              </p>
              <a
                href="mailto:support@eventpro.example?subject=Change%20birth%20date"
                className="mt-1 inline-block text-xs text-indigo hover:underline"
              >
                Contact support to change
              </a>
            </div>
          ) : (
            <>
              <input
                id="birth-date"
                type="date"
                value={fields.birthDate}
                onChange={(e) => set("birthDate", e.target.value)}
                onBlur={() => markTouched("birthDate")}
                disabled={saving}
                max={toDateInputValue(new Date().toISOString())}
                aria-invalid={showError("birthDate") ? true : undefined}
                aria-describedby={showError("birthDate") ? "birth-date-error" : undefined}
                className={`${inputClass(!!showError("birthDate"))} max-w-[260px] [color-scheme:dark]`}
              />
              {showError("birthDate") && (
                <p id="birth-date-error" className="mt-1.5 text-xs text-error">
                  {errors.birthDate}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {saveError.kind === "retry" && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mt-6 flex flex-wrap items-center gap-3 rounded border border-error/40 bg-error-container/20 px-4 py-3 text-sm text-error focus:outline-none"
        >
          <span>Couldn&apos;t save your changes. Try again.</span>
          <button
            type="button"
            onClick={() => void save()}
            className="rounded border border-error/40 px-3 py-1 text-xs text-error transition-colors hover:bg-error/10"
          >
            Retry
          </button>
        </div>
      )}

      <div className="mt-8 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={revert}
          disabled={!isDirty || saving}
          title="Revert changes"
          className="rounded px-4 py-2 text-sm text-on-surface-variant/70 transition-colors hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid || saving}
          title={!isValid ? "Fix validation errors to save" : undefined}
          className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded bg-primary px-5 py-2 text-sm font-medium text-on-primary transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container disabled:cursor-not-allowed disabled:bg-surface-high disabled:text-muted"
        >
          {saving && <SpinnerIcon className="animate-spin" width={15} height={15} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div ref={statusRef} tabIndex={-1} role="status" className="sr-only">
        {showToast ? "Profile updated" : ""}
      </div>

      {showToast && (
        <Toast message="Profile updated" onDismiss={() => setShowToast(false)} />
      )}
    </form>
  );
}
