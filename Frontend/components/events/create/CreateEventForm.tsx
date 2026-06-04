"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SpinnerIcon } from "@/components/icons";
import { ApiError, createEvent, uploadEventPicture } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import type { CreateEventRequest, Venue } from "@/lib/types";
import { CoverImageSection } from "./CoverImageSection";
import {
  DESC_MAX,
  EssentialDetailsSection,
  TITLE_MAX,
} from "./EssentialDetailsSection";
import { SchedulingSection } from "./SchedulingSection";
import { VenueAllocationSection } from "./VenueAllocationSection";

type SubmitError =
  | { kind: "none" }
  | { kind: "rejected"; message: string }
  | { kind: "forbidden" }
  | { kind: "retry" };

// `datetime-local` ("YYYY-MM-DDTHH:mm") parses as local time; toISOString gives UTC.
function toIso(local: string): string {
  return new Date(local).toISOString();
}

export function CreateEventForm({
  venues,
  categories,
  onDirtyChange,
}: {
  venues: Venue[];
  categories: string[];
  onDirtyChange: (dirty: boolean) => void;
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [capacity, setCapacity] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [endAutoCleared, setEndAutoCleared] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [touched, setTouched] = useState({
    title: false,
    description: false,
    category: false,
    capacity: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SubmitError>({ kind: "none" });

  const submittedRef = useRef(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const redirectTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      if (redirectTimer.current) window.clearTimeout(redirectTimer.current);
    },
    [],
  );

  // ── Derived validation ────────────────────────────────────────────────────
  const trimmedTitle = title.trim();
  const trimmedDesc = description.trim();
  const capacityNum = Number(capacity);
  const capacityValid =
    capacity.trim() !== "" && Number.isInteger(capacityNum) && capacityNum > 0;
  const selectedVenue = useMemo(
    () => venues.find((v) => v.id === selectedVenueId) ?? null,
    [venues, selectedVenueId],
  );
  const venueCapacityExceeded =
    capacityValid &&
    selectedVenue?.capacity != null &&
    capacityNum > selectedVenue.capacity;

  const capacityExceedsError = venueCapacityExceeded
    ? `Event capacity (${formatNumber(capacityNum)}) exceeds venue (${formatNumber(
        selectedVenue!.capacity!,
      )}).`
    : null;

  const titleError =
    trimmedTitle.length === 0
      ? "Title is required."
      : trimmedTitle.length < 4
        ? "Title must be at least 4 characters."
        : trimmedTitle.length > TITLE_MAX
          ? `Title must be ${TITLE_MAX} characters or fewer.`
          : null;
  const descriptionError =
    trimmedDesc.length === 0
      ? "Description is required."
      : trimmedDesc.length < 10
        ? "Description must be at least 10 characters."
        : trimmedDesc.length > DESC_MAX
          ? `Description must be ${DESC_MAX} characters or fewer.`
          : null;
  const categoryError = !category ? "Select a category." : null;
  const capacityFormatError = !capacityValid
    ? "Enter a capacity greater than 0."
    : null;

  const endError =
    start && end && new Date(end) <= new Date(start)
      ? "End must be after start."
      : null;
  const startInPast = !!start && new Date(start).getTime() < Date.now();

  const isValid =
    !titleError &&
    !descriptionError &&
    !categoryError &&
    !capacityFormatError &&
    !venueCapacityExceeded &&
    !!start &&
    !!end &&
    !endError &&
    !!selectedVenue;

  // ── Dirty tracking ──────────────────────────────────────────────────────────
  const isDirty =
    title !== "" ||
    description !== "" ||
    category !== null ||
    capacity !== "" ||
    start !== "" ||
    end !== "" ||
    selectedVenueId !== null ||
    imageFile !== null;

  useEffect(() => {
    onDirtyChange(submittedRef.current ? false : isDirty);
  }, [isDirty, onDirtyChange]);

  // ── Field handlers ────────────────────────────────────────────────────────
  function markTouched(field: keyof typeof touched) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  function onStartChange(value: string) {
    setStart(value);
    // If the new start is at/after the current end, clear end and note why.
    if (value && end && new Date(end) <= new Date(value)) {
      setEnd("");
      setEndAutoCleared(true);
    } else {
      setEndAutoCleared(false);
    }
  }

  function onEndChange(value: string) {
    setEnd(value);
    setEndAutoCleared(false);
  }

  function onToggleVenue(venue: Venue) {
    setSelectedVenueId((cur) => (cur === venue.id ? null : venue.id));
  }

  function handleCancel() {
    if (
      isDirty &&
      !window.confirm("Discard event? Your changes will be lost.")
    ) {
      return;
    }
    submittedRef.current = true; // suppress guards for the programmatic nav
    onDirtyChange(false);
    router.back();
  }

  // ── Two-phase submit ──────────────────────────────────────────────────────
  async function submit() {
    setTouched({
      title: true,
      description: true,
      category: true,
      capacity: true,
    });
    if (!isValid || submitting || !selectedVenue) return;

    setSubmitting(true);
    setSubmitError({ kind: "none" });

    const body: CreateEventRequest = {
      title: trimmedTitle,
      description: trimmedDesc,
      startDate: toIso(start),
      endDate: toIso(end),
      // Derived silently from the selected venue (no separate inputs).
      city: selectedVenue.city,
      address: selectedVenue.address,
      country: selectedVenue.country,
      categoryName: category!,
      // TODO: the categories endpoint returns names only, so no description is
      // available to send. Backend defaults/ignores an empty string.
      categoryDescription: "",
      venueId: String(selectedVenue.id),
      capacity: capacityNum,
    };

    let id: string;
    try {
      id = await createEvent(body);
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ApiError && err.status === 400) {
        setSubmitError({ kind: "rejected", message: err.message });
      } else if (err instanceof ApiError && err.status === 403) {
        setSubmitError({ kind: "forbidden" });
        redirectTimer.current = window.setTimeout(
          () => router.push("/?denied=create-event"),
          3000,
        );
      } else {
        // 401 is handled inside authedFetch (refresh/login); anything else retries.
        setSubmitError({ kind: "retry" });
      }
      requestAnimationFrame(() => bannerRef.current?.focus());
      return;
    }

    // Phase 2: optional image upload. Failure is non-fatal — the event exists.
    let imageFailed = false;
    if (imageFile) {
      try {
        await uploadEventPicture(id, imageFile);
      } catch {
        imageFailed = true;
      }
    }

    // Success: drop guards, then navigate to the details page with the flags.
    submittedRef.current = true;
    onDirtyChange(false);
    const qs = imageFailed
      ? "?created=true&imageFailed=true"
      : "?created=true";
    router.push(`/events/${id}${qs}`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void submit();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 space-y-6">
      {submitError.kind !== "none" && (
        <div
          ref={bannerRef}
          tabIndex={-1}
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded border border-error/40 bg-error-container/20 px-4 py-3 text-sm text-error focus:outline-none"
        >
          {submitError.kind === "rejected" && (
            <span>Server rejected: {submitError.message}</span>
          )}
          {submitError.kind === "forbidden" && (
            <span>
              You don&apos;t have permission to create events. Redirecting…
            </span>
          )}
          {submitError.kind === "retry" && (
            <>
              <span>Couldn&apos;t create the event. Try again.</span>
              <button
                type="button"
                onClick={() => void submit()}
                className="rounded border border-error/40 px-3 py-1 text-xs text-error transition-colors hover:bg-error/10"
              >
                Retry
              </button>
            </>
          )}
        </div>
      )}

      <EssentialDetailsSection
        title={title}
        description={description}
        category={category}
        capacity={capacity}
        categories={categories}
        errors={{
          title: touched.title ? titleError : null,
          description: touched.description ? descriptionError : null,
          category: touched.category ? categoryError : null,
          // Format error gated by touch; the venue-relationship error always shows.
          capacity: (touched.capacity ? capacityFormatError : null) ?? capacityExceedsError,
        }}
        disabled={submitting}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onCategoryChange={setCategory}
        onCapacityChange={setCapacity}
        onBlur={markTouched}
      />

      <SchedulingSection
        start={start}
        end={end}
        endError={endError}
        startInPast={startInPast}
        endAutoCleared={endAutoCleared}
        disabled={submitting}
        onStartChange={onStartChange}
        onEndChange={onEndChange}
      />

      <VenueAllocationSection
        venues={venues}
        selectedVenueId={selectedVenueId}
        capacityErrorText={capacityExceedsError}
        disabled={submitting}
        onToggleVenue={onToggleVenue}
      />

      <CoverImageSection
        file={imageFile}
        disabled={submitting}
        onSelect={setImageFile}
        onRemove={() => setImageFile(null)}
      />

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={submitting}
          className="rounded px-4 py-2 text-sm text-on-surface-variant/70 transition-colors hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid || submitting}
          title={!isValid ? "Complete the required fields to create the event" : undefined}
          className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded bg-primary px-5 py-2 text-sm font-medium text-on-primary transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container disabled:cursor-not-allowed disabled:bg-surface-high disabled:text-muted"
        >
          {submitting && (
            <SpinnerIcon className="animate-spin" width={15} height={15} />
          )}
          {submitting ? "Creating..." : "Create Event"}
        </button>
      </div>
    </form>
  );
}
