"use client";

import { CategorySelect } from "./CategorySelect";
import {
  errorTextClass,
  helpClass,
  inputClass,
  labelClass,
  sectionCardClass,
  sectionHeadingClass,
  sectionSubtitleClass,
} from "./formStyles";

export const TITLE_MAX = 120;
export const DESC_MAX = 2000;
const DESC_WARN = 1800;

export function EssentialDetailsSection({
  title,
  description,
  category,
  capacity,
  errors,
  disabled,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  onCapacityChange,
  onBlur,
}: {
  title: string;
  description: string;
  category: string;
  capacity: string;
  errors: {
    title: string | null;
    description: string | null;
    category: string | null;
    capacity: string | null;
  };
  disabled: boolean;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onCapacityChange: (v: string) => void;
  onBlur: (field: "title" | "description" | "category" | "capacity") => void;
}) {
  const descLen = description.length;
  const counterClass =
    descLen > DESC_MAX
      ? "text-error"
      : descLen >= DESC_WARN
        ? "text-[#f5b54a]"
        : "text-muted";

  return (
    <section className={sectionCardClass} aria-labelledby="essential-heading">
      <h2 id="essential-heading" className={sectionHeadingClass}>
        Essential Details
      </h2>
      <p className={sectionSubtitleClass}>
        Name your event, describe it, and set how many people can attend.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        {/* Title — full width */}
        <div className="sm:col-span-2">
          <label htmlFor="event-title" className={labelClass}>
            Title
          </label>
          <input
            id="event-title"
            type="text"
            value={title}
            maxLength={TITLE_MAX}
            disabled={disabled}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={() => onBlur("title")}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? "event-title-error" : "event-title-help"}
            className={inputClass(!!errors.title)}
          />
          {errors.title ? (
            <p id="event-title-error" className={errorTextClass}>
              {errors.title}
            </p>
          ) : (
            <p id="event-title-help" className={helpClass}>
              4–120 characters
            </p>
          )}
        </div>

        {/* Description — full width */}
        <div className="sm:col-span-2">
          <label htmlFor="event-description" className={labelClass}>
            Description
          </label>
          <div className="relative">
            <textarea
              id="event-description"
              value={description}
              maxLength={DESC_MAX}
              rows={5}
              disabled={disabled}
              onChange={(e) => onDescriptionChange(e.target.value)}
              onBlur={() => onBlur("description")}
              aria-invalid={errors.description ? true : undefined}
              aria-describedby="event-description-help event-description-counter"
              className={`${inputClass(!!errors.description)} resize-y pb-7`}
            />
            <span
              id="event-description-counter"
              className={`pointer-events-none absolute bottom-2.5 right-3 text-[11px] tabular-nums ${counterClass}`}
            >
              {descLen} / {DESC_MAX}
            </span>
          </div>
          {errors.description ? (
            <p id="event-description-error" className={errorTextClass} role="alert">
              {errors.description}
            </p>
          ) : (
            <p id="event-description-help" className={helpClass}>
              10–2000 characters
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="event-category" className={labelClass}>
            Category
          </label>
          <input
              id="event-category"
              type="text"
              value={category ?? ''}
              maxLength={TITLE_MAX}
              disabled={disabled}
              onChange={(e) => onCategoryChange(e.target.value)}
              onBlur={() => onBlur("category")}
              aria-invalid={!!errors.category}
              aria-describedby={errors.category ? "event-category-error" : undefined}
              className={inputClass(!!errors.title)}
          />
          {errors.category && (
            <p id="event-category-error" className={errorTextClass}>
              {errors.category}
            </p>
          )}
        </div>

        {/* Target capacity */}
        <div>
          <label htmlFor="event-capacity" className={labelClass}>
            Target Capacity
          </label>
          <input
            id="event-capacity"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={capacity}
            disabled={disabled}
            onChange={(e) => onCapacityChange(e.target.value)}
            onBlur={() => onBlur("capacity")}
            aria-invalid={errors.capacity ? true : undefined}
            aria-describedby={
              errors.capacity ? "event-capacity-error" : "event-capacity-help"
            }
            className={inputClass(!!errors.capacity)}
          />
          {errors.capacity ? (
            <p id="event-capacity-error" className={errorTextClass} role="alert">
              {errors.capacity}
            </p>
          ) : (
            <p id="event-capacity-help" className={helpClass}>
              Max attendees for this event
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
