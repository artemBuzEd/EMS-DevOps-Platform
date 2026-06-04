"use client";

import { useEffect, useRef, useState } from "react";
import { TrashIcon, UploadIcon } from "@/components/icons";
import {
  errorTextClass,
  sectionCardClass,
  sectionHeadingClass,
  sectionSubtitleClass,
} from "./formStyles";

const MAX_BYTES = 6 * 1024 * 1024; // matches [RequestSizeLimit(6MB)] on the backend
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_EXT = [".jpg", ".jpeg", ".png", ".webp"];

// Validate type (MIME + extension) and size before any network call.
function validateImage(file: File): string | null {
  const name = file.name.toLowerCase();
  const extOk = ACCEPTED_EXT.some((ext) => name.endsWith(ext));
  const typeOk = ACCEPTED_TYPES.includes(file.type);
  if (!extOk || !typeOk) {
    return "Unsupported file. Use JPEG, PNG, or WebP.";
  }
  if (file.size > MAX_BYTES) {
    return "Image is larger than 6 MB. Choose a smaller file.";
  }
  return null;
}

export function CoverImageSection({
  file,
  disabled,
  onSelect,
  onRemove,
}: {
  file: File | null;
  disabled: boolean;
  onSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Object URL for the local preview — revoke when the file changes/unmounts.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function accept(candidate: File | undefined) {
    if (!candidate) return;
    const err = validateImage(candidate);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onSelect(candidate);
  }

  function remove() {
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onRemove();
  }

  return (
    <section className={sectionCardClass} aria-labelledby="cover-heading">
      <h2 id="cover-heading" className={sectionHeadingClass}>
        Cover Image
      </h2>
      <p className={sectionSubtitleClass}>
        Optional. Shown as the hero on the event page (JPEG, PNG, or WebP, up to 6
        MB).
      </p>

      <div className="mt-6">
        {file && previewUrl ? (
          <div className="space-y-3">
            {/* 16:9 preview matching the details-page hero crop */}
            <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-card)] border border-white/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Cover preview"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="truncate text-xs text-muted">{file.name}</span>
              <button
                type="button"
                onClick={remove}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-on-surface-variant/80 transition-colors hover:text-error disabled:opacity-50"
              >
                <TrashIcon width={14} height={14} />
                Remove image
              </button>
            </div>
          </div>
        ) : (
          <label
            htmlFor="cover-input"
            onDragOver={(e) => {
              e.preventDefault();
              if (!disabled) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (!disabled) accept(e.dataTransfer.files?.[0]);
            }}
            className={[
              "flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed text-center transition-colors",
              dragOver
                ? "border-secondary-container bg-secondary-container/5"
                : "border-white/15 hover:border-white/30",
              disabled ? "cursor-not-allowed opacity-50" : "",
            ].join(" ")}
          >
            <UploadIcon className="text-muted" width={22} height={22} />
            <span className="text-sm text-on-surface-variant">
              Drag &amp; drop an image, or{" "}
              <span className="text-secondary">browse</span>
            </span>
            <span className="text-xs text-muted">JPEG, PNG, WebP · up to 6 MB</span>
          </label>
        )}

        <input
          ref={inputRef}
          id="cover-input"
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          disabled={disabled}
          onChange={(e) => accept(e.target.files?.[0])}
          className="sr-only"
        />

        {error && (
          <p className={errorTextClass} role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
