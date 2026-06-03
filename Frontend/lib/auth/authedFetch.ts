import { keycloak } from "./keycloak";

class SessionExpiredError extends Error {
  constructor() {
    super("Session expired");
    this.name = "SessionExpiredError";
  }
}

function withBearer(init: RequestInit | undefined): RequestInit {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${keycloak.token}`);
  return { ...init, headers };
}

/**
 * fetch() wrapper for authenticated calls. Single source of token handling:
 *  - refreshes the access token if it has <30s left (the SDK dedupes
 *    concurrent refreshes since there is one keycloak instance),
 *  - on a 401 (token valid client-side but rejected by the server — revoked or
 *    clock skew) it forces one refresh and retries exactly once,
 *  - if the refresh token itself is gone it kicks off a full re-login.
 * No setInterval — refresh is driven by need + onTokenExpired.
 */
export async function authedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  try {
    await keycloak.updateToken(30);
  } catch {
    keycloak.login();
    throw new SessionExpiredError();
  }

  let res = await fetch(input, withBearer(init));

  if (res.status === 401) {
    try {
      await keycloak.updateToken(-1); // force a refresh
    } catch {
      keycloak.login();
      throw new SessionExpiredError();
    }
    res = await fetch(input, withBearer(init));
    if (res.status === 401) {
      keycloak.login(); // still rejected — re-authenticate (no further retry)
    }
  }

  return res;
}

export { SessionExpiredError };
