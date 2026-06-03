"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getEvents,
  getEventsByDateRange,
  getUpcomingEvents,
  searchEvents,
} from "@/lib/api";
import type { EventListItem } from "@/lib/types";

export type SortKey = "date-asc" | "date-desc" | "title";

export interface Filters {
  search: string;
  from: string; // yyyy-mm-dd (date input value) or ""
  to: string;
  upcoming: boolean;
  category: string; // client-side filter on already-fetched results
  sort: SortKey;
}

// Which EventsController endpoint backs the current filter combination.
type Mode = "default" | "upcoming" | "search" | "dateRange";

export const PAGE_SIZE = 20;

// Readable query-string params (bonus: ?search=&from=&to=&upcoming=&category=&sort=).
function parseFilters(sp: ReadonlyURLSearchParams): Filters {
  const sort = sp.get("sort");
  return {
    search: sp.get("search") ?? "",
    from: sp.get("from") ?? "",
    to: sp.get("to") ?? "",
    upcoming: sp.get("upcoming") === "true",
    category: sp.get("category") ?? "",
    sort:
      sort === "date-desc" || sort === "title" ? sort : "date-asc",
  };
}

// Endpoint precedence. Text search wins when present because it's the highest-signal
// filter; "upcoming" and an explicit date range are kept mutually exclusive in the UI
// (toggling one clears the other), so they never collide here.
function resolveMode(f: Filters): Mode {
  if (f.search.trim()) return "search";
  if (f.upcoming) return "upcoming";
  if (f.from || f.to) return "dateRange";
  return "default";
}

const isPagedMode = (m: Mode) => m === "default" || m === "upcoming";

// Open-ended bounds: picking only "start" means "no upper bound" and vice versa.
const startOfDay = (d: string) => `${d}T00:00:00`;
const endOfDay = (d: string) => `${d}T23:59:59`;

function withinDateRange(from: string, to: string) {
  const lo = from ? new Date(startOfDay(from)).getTime() : -Infinity;
  const hi = to ? new Date(endOfDay(to)).getTime() : Infinity;
  return (e: EventListItem) => {
    const t = new Date(e.startDate).getTime();
    return t >= lo && t <= hi;
  };
}

function sorter(sort: SortKey) {
  return (a: EventListItem, b: EventListItem) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    const da = new Date(a.startDate).getTime();
    const db = new Date(b.startDate).getTime();
    return sort === "date-desc" ? db - da : da - db;
  };
}

interface FetchResult {
  items: EventListItem[];
  total: number;
}

async function fetchEvents(
  f: Filters,
  mode: Mode,
  page: number,
  signal: AbortSignal,
): Promise<FetchResult> {
  if (mode === "default") {
    const r = await getEvents(page, PAGE_SIZE, signal);
    return { items: r.items ?? [], total: r.totalCount ?? 0 };
  }
  if (mode === "upcoming") {
    const r = await getUpcomingEvents(page, PAGE_SIZE, signal);
    return { items: r.items ?? [], total: r.totalCount ?? 0 };
  }
  if (mode === "search") {
    let items = await searchEvents(f.search.trim(), signal);
    // Text + date combined: no single endpoint accepts both, so we use the text
    // search (higher-signal) as the primary call and narrow the result by date
    // client-side. Not ideal — the limitation is in the backend, which has no
    // endpoint taking both a query string and a date range.
    if (f.from || f.to) items = items.filter(withinDateRange(f.from, f.to));
    return { items, total: items.length };
  }
  // dateRange — full (non-paged) list.
  const items = await getEventsByDateRange(
    startOfDay(f.from || "1900-01-01"),
    endOfDay(f.to || "2999-12-31"),
    signal,
  );
  return { items, total: items.length };
}

export type ListStatus = "loading" | "ready" | "error";

export interface EventListing {
  filters: Filters;
  /** Local, immediate search-box value (debounced before it reaches the URL). */
  searchInput: string;
  setSearchInput: (v: string) => void;
  /** Events after client-side category filter + sort. */
  visible: EventListItem[];
  /** Total available on the server for the current query (pre client filter). */
  total: number;
  status: ListStatus;
  dateError: boolean;
  isPaged: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  retry: () => void;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  toggleUpcoming: () => void;
  setCategory: (v: string) => void;
  setSort: (v: SortKey) => void;
  clearSearch: () => void;
  removeFilter: (key: keyof Filters) => void;
  clearAll: () => void;
  activeFilterCount: number;
}

export function useEventListing(): EventListing {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const filters = useMemo(() => parseFilters(sp), [sp]);
  const mode = resolveMode(filters);
  const isPaged = isPagedMode(mode);
  const dateError = Boolean(
    filters.from && filters.to && filters.from > filters.to,
  );

  const [items, setItems] = useState<EventListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ListStatus>("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  // ── URL writers ───────────────────────────────────────────────────────────
  // Read the live query string from window.location (not the captured `sp`) so
  // several updates fired in the same tick compose instead of clobbering each
  // other via a stale closure.
  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(window.location.search);
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  // ── Debounced search → URL ─────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState(filters.search);
  // Keep the box in sync when the URL changes from elsewhere (back/forward, chip X).
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);
  // 300ms debounce: typing "drift" fires one navigation, not five. Typing a query
  // also clears "upcoming" so the two never fight (search takes precedence).
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== filters.search) {
        setParams({
          search: searchInput || null,
          ...(searchInput ? { upcoming: null } : {}),
        });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // ── Fetch on server-relevant filter change ─────────────────────────────────
  // category/sort are client-side, so they're deliberately NOT in this signature.
  const sig = `${mode}|${filters.search.trim()}|${filters.from}|${filters.to}|${reloadNonce}`;
  useEffect(() => {
    if (dateError) {
      // Invalid range (start > end): show nothing, don't fire a request.
      abortRef.current?.abort();
      setItems([]);
      setTotal(0);
      setStatus("ready");
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStatus("loading");
    setPage(1);
    fetchEvents(filters, mode, 1, ctrl.signal)
      .then((r) => {
        if (ctrl.signal.aborted) return;
        setItems(r.items);
        setTotal(r.total);
        setStatus("ready");
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted || (e as Error)?.name === "AbortError") return;
        setStatus("error");
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const hasMore = isPaged && status === "ready" && items.length < total;

  const loadMore = useCallback(() => {
    if (!isPaged || loadingMore || !hasMore) return;
    const next = page + 1;
    setLoadingMore(true);
    const ctrl = new AbortController();
    fetchEvents(filters, mode, next, ctrl.signal)
      .then((r) => {
        // Append — existing cards must not move or re-render.
        setItems((prev) => [...prev, ...r.items]);
        setTotal(r.total);
        setPage(next);
      })
      .catch(() => {
        /* keep what's shown; the button returns to its idle state */
      })
      .finally(() => setLoadingMore(false));
  }, [isPaged, loadingMore, hasMore, page, filters, mode]);

  const retry = useCallback(() => setReloadNonce((n) => n + 1), []);

  // ── Client-side view (category filter + sort) ──────────────────────────────
  const visible = useMemo(() => {
    let v = items;
    const cat = filters.category.trim().toLowerCase();
    if (cat) {
      v = v.filter((e) => e.categoryName?.toLowerCase().includes(cat));
    }
    return [...v].sort(sorter(filters.sort));
  }, [items, filters.category, filters.sort]);

  // ── Filter mutators ────────────────────────────────────────────────────────
  // Date range and "upcoming" are mutually exclusive: setting a date clears the
  // toggle, and the toggle clears the dates (see toggleUpcoming).
  const setFrom = useCallback(
    (v: string) => setParams({ from: v || null, upcoming: null }),
    [setParams],
  );
  const setTo = useCallback(
    (v: string) => setParams({ to: v || null, upcoming: null }),
    [setParams],
  );
  const toggleUpcoming = useCallback(
    () =>
      setParams({
        upcoming: filters.upcoming ? null : "true",
        from: null,
        to: null,
      }),
    [setParams, filters.upcoming],
  );
  const setCategory = useCallback(
    (v: string) => setParams({ category: v || null }),
    [setParams],
  );
  const setSort = useCallback(
    (v: SortKey) => setParams({ sort: v === "date-asc" ? null : v }),
    [setParams],
  );
  const clearSearch = useCallback(() => {
    setSearchInput("");
    setParams({ search: null });
  }, [setParams]);

  const removeFilter = useCallback(
    (key: keyof Filters) => {
      switch (key) {
        case "search":
          clearSearch();
          break;
        case "upcoming":
          setParams({ upcoming: null });
          break;
        case "from":
          setParams({ from: null });
          break;
        case "to":
          setParams({ to: null });
          break;
        case "category":
          setParams({ category: null });
          break;
        case "sort":
          setParams({ sort: null });
          break;
      }
    },
    [setParams, clearSearch],
  );

  const clearAll = useCallback(() => {
    setSearchInput("");
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  // Count only the filters that affect results (sort is a view preference).
  const activeFilterCount =
    (filters.search.trim() ? 1 : 0) +
    (filters.from ? 1 : 0) +
    (filters.to ? 1 : 0) +
    (filters.upcoming ? 1 : 0) +
    (filters.category.trim() ? 1 : 0);

  return {
    filters,
    searchInput,
    setSearchInput,
    visible,
    total,
    status,
    dateError,
    isPaged,
    hasMore,
    loadingMore,
    loadMore,
    retry,
    setFrom,
    setTo,
    toggleUpcoming,
    setCategory,
    setSort,
    clearSearch,
    removeFilter,
    clearAll,
    activeFilterCount,
  };
}

// Local alias for the next/navigation read-only params type.
type ReadonlyURLSearchParams = ReturnType<typeof useSearchParams>;
