"use client";

import { useEffect, useState } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";
import { Toast } from "./profile/Toast";

/**
 * Reads the URL query once on mount, derives a one-time toast message via
 * `resolve`, then strips the consumed params so a refresh won't re-show it.
 * Must be rendered inside a <Suspense> boundary (useSearchParams requirement).
 */
export function FlashToast({
  resolve,
  stripParams,
}: {
  resolve: (params: ReadonlyURLSearchParams) => string | null;
  stripParams: string[];
}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [message, setMessage] = useState<string | null>(null);

  // Run once: the relevant flags are present on first render after navigation.
  useEffect(() => {
    const msg = resolve(params);
    if (!msg) return;
    setMessage(msg);

    const next = new URLSearchParams(params.toString());
    let changed = false;
    for (const p of stripParams) {
      if (next.has(p)) {
        next.delete(p);
        changed = true;
      }
    }
    if (changed) {
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!message) return null;
  return <Toast message={message} onDismiss={() => setMessage(null)} />;
}
