"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Client-side data fetching for the app's `"use client"` pages. Owns the parts
 * every page was hand-rolling — an AbortController, the loading→ready/error
 * transition, and ignoring results after unmount — so pages keep only their
 * domain-specific error mapping by inspecting `state.error`.
 *
 * Pass `enabled: false` to defer the fetch (e.g. until a role check passes);
 * the state stays "loading" until it flips true. `retry()` re-runs the fetcher.
 */
export type ResourceState<T> =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; data: T };

export function useResource<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList,
  options?: { enabled?: boolean },
): ResourceState<T> & { retry: () => void } {
  const enabled = options?.enabled ?? true;
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<ResourceState<T>>({ status: "loading" });

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    setState({ status: "loading" });

    fetcher(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: "ready", data });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ status: "error", error });
      });

    return () => controller.abort();
    // `fetcher` is intentionally excluded — callers pass an inline closure and
    // declare its real inputs via `deps`, mirroring useEffect's contract.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reloadKey, ...deps]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  return { ...state, retry };
}
