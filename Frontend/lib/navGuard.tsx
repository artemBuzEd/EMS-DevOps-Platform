"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

/**
 * In-app navigation guard. The Navbar consults it before changing routes so a
 * page with unsaved edits (Edit Profile, Create Event) can prompt first.
 *
 * The guard lives ABOVE the Navbar (installed once in the authed layout) and is
 * registered imperatively by the page that needs it — that's why the consumer
 * reads through a ref: the Navbar gets a stable `guard()` that always calls the
 * latest registered function. With no provider (public pages) it allows freely.
 */
type GuardFn = () => boolean;

const ConsumerContext = createContext<GuardFn>(() => true);
const RegisterContext = createContext<(guard: GuardFn | null) => void>(() => {});

export function NavGuardProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<GuardFn>(() => true);
  const guard = useCallback(() => ref.current(), []);
  const register = useCallback((fn: GuardFn | null) => {
    ref.current = fn ?? (() => true);
  }, []);

  return (
    <RegisterContext.Provider value={register}>
      <ConsumerContext.Provider value={guard}>
        {children}
      </ConsumerContext.Provider>
    </RegisterContext.Provider>
  );
}

/** Consumed by the Navbar: returns `true` if navigation may proceed. */
export function useNavGuard(): GuardFn {
  return useContext(ConsumerContext);
}

/**
 * Installed by pages with a dirty form. While `isDirty`, it both warns on tab
 * close/refresh (native `beforeunload`) and registers an in-app guard that
 * confirms before the Navbar navigates away. Cleans up when clean or unmounted.
 */
export function useUnsavedChangesWarning(isDirty: boolean, message: string) {
  const register = useContext(RegisterContext);

  useEffect(() => {
    if (!isDirty) {
      register(null);
      return;
    }

    register(() => window.confirm(message));

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      register(null);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [isDirty, message, register]);
}
