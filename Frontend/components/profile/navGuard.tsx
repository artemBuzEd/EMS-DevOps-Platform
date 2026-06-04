"use client";

import { createContext, useContext } from "react";

/**
 * A guard the Navbar consults before navigating away. Returns `true` if navigation
 * may proceed, `false` to cancel. The default (no provider) always allows — only the
 * Edit Profile page installs a real guard that prompts when the form is dirty.
 */
export const NavGuardContext = createContext<() => boolean>(() => true);

export function useNavGuard(): () => boolean {
  return useContext(NavGuardContext);
}
