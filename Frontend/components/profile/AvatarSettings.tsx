"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, deleteAvatar, mediaUrl, uploadAvatar } from "@/lib/api";
import { PencilIcon, SpinnerIcon } from "../icons";

const ACCEPT = "image/jpeg,image/png,image/webp";
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"];
const MAX_BYTES = 5 * 1024 * 1024;

// Type is checked by BOTH mime and extension so a renamed binary (e.g. .exe -> .jpg)
// is rejected before any network call.
function validateFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_MIME.includes(file.type) || !ALLOWED_EXT.includes(ext)) {
    return "Only JPEG, PNG, and WebP are supported.";
  }
  if (file.size > MAX_BYTES) {
    return "Your image is over 5 MB. Try a smaller one.";
  }
  return null;
}

function uploadErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 413) return "Your image is over 5 MB. Try a smaller one.";
    if (err.status === 415) return "Only JPEG, PNG, and WebP are supported.";
    if (err.status === 404) return "Your profile is missing.";
  }
  return "Couldn't upload your avatar. Try again.";
}

export function AvatarSettings({
  userId,
  initialAvatarUrl,
  initials,
}: {
  userId: string;
  initialAvatarUrl: string | null;
  initials: string;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Track the live object URL so it can be revoked on unmount (memory-leak guard).
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const displaySrc = previewUrl ?? mediaUrl(avatarUrl);
  const hasAvatar = avatarUrl !== null;

  function revokePreview() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreviewUrl(null);
  }

  async function handleFile(file: File) {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl); // optimistic preview while the upload runs
    setUploading(true);

    try {
      const serverUrl = await uploadAvatar(userId, file);
      setAvatarUrl(serverUrl); // swap to the server's URL...
      revokePreview(); // ...and release the blob
    } catch (err) {
      revokePreview(); // revert to the previous avatar
      setError(uploadErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset so picking the same file again re-fires change.
    e.target.value = "";
    if (file) void handleFile(file);
  }

  function openPicker() {
    setError(null);
    fileInputRef.current?.click();
  }

  async function confirmRemove() {
    setError(null);
    setRemoving(true);
    try {
      await deleteAvatar(userId);
      setAvatarUrl(null);
      setConfirmingRemove(false);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 404
          ? "Your profile is missing."
          : "Couldn't remove your avatar. Try again.",
      );
    } finally {
      setRemoving(false);
    }
  }

  return (
    <section className="card-glow rounded-[var(--radius-card)] p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative h-24 w-24 shrink-0">
          {displaySrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displaySrc}
              alt="Your avatar"
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-indigo to-secondary-container text-2xl font-semibold text-white"
            >
              {initials}
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 grid place-items-center rounded-full bg-black/55">
              <SpinnerIcon className="animate-spin text-white" width={24} height={24} />
            </div>
          )}

          <button
            type="button"
            onClick={openPicker}
            disabled={uploading}
            aria-label="Edit avatar"
            className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-surface-high text-on-surface transition-colors hover:bg-surface-highest disabled:opacity-50"
          >
            <PencilIcon width={15} height={15} />
          </button>
        </div>

        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-on-surface">
            Avatar Settings
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Upload a new avatar or remove the current one.
          </p>
          <p className="text-sm text-muted">JPEG, PNG, or WebP. Up to 5 MB.</p>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            onChange={onFileChange}
            className="hidden"
          />

          {confirmingRemove ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-sm text-on-surface">Remove your avatar?</span>
              <button
                type="button"
                onClick={confirmRemove}
                disabled={removing}
                className="inline-flex items-center gap-2 rounded border border-white/15 bg-white/[0.04] px-3 py-1.5 text-sm text-on-surface transition-colors hover:bg-white/[0.08] disabled:opacity-50"
              >
                {removing && (
                  <SpinnerIcon className="animate-spin" width={14} height={14} />
                )}
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmingRemove(false)}
                disabled={removing}
                className="rounded px-3 py-1.5 text-sm text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openPicker}
                disabled={uploading}
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container disabled:opacity-60"
              >
                Upload New Avatar
              </button>
              <button
                type="button"
                onClick={() => setConfirmingRemove(true)}
                disabled={!hasAvatar || uploading}
                className="rounded border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-on-surface transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Remove Avatar
              </button>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-3 text-sm text-error">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
