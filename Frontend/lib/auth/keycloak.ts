import Keycloak from "keycloak-js";

// Realm/client/URL come from the environment, never hardcoded. See .env.example.
const config = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? "http://localhost:8180",
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? "ems",
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? "ems-spa",
};

// A single Keycloak instance at module scope — multiple instances break the
// login-status iframe and silent refresh. It is only constructed in the
// browser; during Next.js's server render pass `window` is undefined and we
// leave it unset (no auth runs on the server).
export const keycloak: Keycloak =
  typeof window !== "undefined"
    ? new Keycloak(config)
    : (undefined as unknown as Keycloak);
