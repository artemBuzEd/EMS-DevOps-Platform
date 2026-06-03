// Public auth entry point for components. Import { useAuth } from "@/lib/auth/useAuth"
// — components never touch the raw keycloak instance.
export { useAuth } from "./AuthProvider";
export type { AuthUser } from "./types";
