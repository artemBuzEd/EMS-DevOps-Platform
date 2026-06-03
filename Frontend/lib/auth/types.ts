import type { KeycloakTokenParsed } from "keycloak-js";

// Shape of the access token this realm (`ems`) issues. Mirrors the claims in
// the Keycloak client scopes (profile/email + the realm-roles mapper), so
// `keycloak.tokenParsed` is typed instead of `any`.
export interface EmsToken extends KeycloakTokenParsed {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  email?: string;
  email_verified?: boolean;
  realm_access?: { roles: string[] };
  azp?: string;
}

// Normalized view of the signed-in user that components consume via useAuth().
export interface AuthUser {
  /** Keycloak `sub` — the stable user id the backend keys profiles on. */
  sub: string;
  name: string;
  firstName: string;
  lastName: string;
  username: string;
  email?: string;
  roles: string[];
  /** 1–2 char fallback for the avatar when no image is available. */
  initials: string;
}

export function toAuthUser(token: EmsToken | undefined): AuthUser | null {
  if (!token?.sub) return null;

  const firstName = token.given_name ?? "";
  const lastName = token.family_name ?? "";
  const username = token.preferred_username ?? "";
  const name =
    token.name ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    username;

  const initials =
    ((firstName[0] ?? "") + (lastName[0] ?? "")).toUpperCase() ||
    (name[0] ?? username[0] ?? "?").toUpperCase();

  return {
    sub: token.sub,
    name,
    firstName,
    lastName,
    username,
    email: token.email,
    roles: token.realm_access?.roles ?? [],
    initials,
  };
}
