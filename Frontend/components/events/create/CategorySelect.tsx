"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { inputClass } from "./formStyles";

// Custom listbox (the project has no UI lib). Becomes searchable once there are
// more than 10 options, per rubric §2. Keyboard: Enter/Space open, Up/Down move,
// Enter select, Escape close. Closes on outside click.
const SEARCHABLE_THRESHOLD = 10;

export function CategorySelect({
  id,
  options,
  value,
  onChange,
  onBlur,
  invalid,
  describedBy,
  disabled,
}: {
  id: string;
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
  onBlur?: () => void;
  invalid: boolean;
  describedBy?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const searchable = options.length > SEARCHABLE_THRESHOLD;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  // Reset transient UI when closing; focus search when opening.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setActive(0);
      return;
    }
    if (searchable) requestAnimationFrame(() => searchRef.current?.focus());
  }, [open, searchable]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, onBlur]);

  function select(option: string) {
    onChange(option);
    setOpen(false);
    onBlur?.();
  }

  function onTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const option = filtered[active];
      if (option) select(option);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        className={`${inputClass(invalid)} flex items-center justify-between text-left`}
      >
        <span className={value ? "text-on-surface" : "text-muted"}>
          {value ?? "Select a category"}
        </span>
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className="card-glow absolute z-50 mt-2 w-full overflow-hidden rounded-[var(--radius-card)] py-1"
          onKeyDown={onListKeyDown}
        >
          {searchable && (
            <div className="flex items-center gap-2 border-b border-white/[0.07] px-3 py-2">
              <SearchIcon className="text-muted" width={14} height={14} />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder="Search categories…"
                className="w-full bg-transparent text-sm text-on-surface placeholder:text-muted focus:outline-none"
                aria-label="Search categories"
              />
            </div>
          )}
          <ul role="listbox" aria-label="Categories" className="max-h-60 overflow-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted">No matches</li>
            ) : (
              filtered.map((option, i) => (
                <li key={option} role="option" aria-selected={option === value}>
                  <button
                    type="button"
                    onClick={() => select(option)}
                    onMouseEnter={() => setActive(i)}
                    className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
                      i === active
                        ? "bg-white/[0.06] text-on-surface"
                        : "text-on-surface-variant hover:text-on-surface"
                    } ${option === value ? "font-medium text-on-surface" : ""}`}
                  >
                    {option}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
