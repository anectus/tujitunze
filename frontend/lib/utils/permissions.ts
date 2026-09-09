export const ACCESS_TOKEN_STORAGE_KEY = "tujitunze_access_token";
export const AUTH_USER_STORAGE_KEY = "tujitunze_auth_user";

// One-shot signal set by MobileMoneyAccountForm right after a successful
// submit, consumed (and cleared) by the Settings page's own "onboarding
// complete" banner the next time it mounts — sessionStorage rather than
// a query param since the redirect target on completion is /dashboard,
// not /settings, so there's no URL to carry this on for that page.
export const MEMBERSHIP_JUST_COMPLETED_STORAGE_KEY =
  "tujitunze_membership_just_completed";

export interface StoredAuthUser {
  userId: number;
  roles: string[];
  firstName: string;
}

export interface AccessTokenPayload {
  sub: number;
  roles: string[];
  firstName: string;
  iat: number;
  exp: number;
}

// sessionStorage, not localStorage: it's cleared when the browser (or
// tab) closes, so a member has to log in again on their next visit
// instead of staying silently authenticated indefinitely. localStorage
// would survive a full browser restart, which is exactly the behavior
// reported as a vulnerability — see the httpOnly-cookie session cookie
// change in auth-cookie.constants.ts for the backend half of this.
export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function getStoredAuthUser(): StoredAuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = sessionStorage.getItem(AUTH_USER_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as StoredAuthUser;
  } catch {
    sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
}

export function storeAuthUser(user: StoredAuthUser): void {
  sessionStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}

// Decodes the JWT payload only — does not verify the signature. This is a
// client-side UX convenience (deciding what to render); the backend is the
// only place a token's authenticity/roles are actually trusted.
export function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    const payloadSegment = token.split(".")[1];

    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");

    const json = atob(base64);

    return JSON.parse(json) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: AccessTokenPayload): boolean {
  return payload.exp * 1000 <= Date.now();
}

export function hasRole(roles: string[], allowedRoles: string[]): boolean {
  return allowedRoles.some((role) => roles.includes(role));
}

// Where each role lands right after login. Staff roles go straight to
// their own dashboard; Member keeps the existing onboarding funnel as the
// default (also the fallback for a token with no recognized role).
const ROLE_DASHBOARD_PATHS: Record<string, string> = {
  Admin: "/admin/dashboard",
  Bank: "/bank/dashboard",
  Telecom: "/telecom/dashboard",
  Insurance: "/insurance/dashboard",
  "Super-admin": "/super-admin/dashboard",
};

// Returns the staff dashboard for a role that has one, or null if the
// token holds no such role (in practice: a plain Member) — callers decide
// the Member-specific landing page themselves, since that one depends on
// whether onboarding is already complete, not just the role name.
export function getStaffDashboardPath(roles: string[]): string | null {
  const staffRole = roles.find((role) => role in ROLE_DASHBOARD_PATHS);

  return staffRole ? ROLE_DASHBOARD_PATHS[staffRole] : null;
}
