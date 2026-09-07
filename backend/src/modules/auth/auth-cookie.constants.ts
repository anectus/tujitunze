import type { CookieOptions } from 'express';

export const ACCESS_TOKEN_COOKIE_NAME = 'tujitunze_access_token';

// httpOnly: the whole point — this cookie must never be readable via
// document.cookie, so an XSS payload can't exfiltrate it the way it
// could read localStorage. sameSite: 'lax' is enough for this app's
// same-site (same registrable domain "localhost", different port)
// frontend/backend split without needing secure:true — SameSite is
// scoped by eTLD+1, not full origin, so a Lax cookie set by the API on
// :3012 is still sent on a fetch from the frontend on :3001 as long as
// that fetch uses credentials: 'include'. secure only turns on in
// production (real HTTPS), since a Secure cookie is silently dropped
// over the plain HTTP this app runs on locally.
//
// Deliberately no maxAge/expires: this is a session cookie, so the
// browser drops it when the browser closes and a fresh login is
// required next visit, rather than surviving as a standing credential.
// The JWT inside it still carries its own `exp` (JWT_EXPIRES_IN_SECONDS)
// and JwtStrategy still enforces that server-side regardless — this only
// controls whether closing the browser ends the session early.
export function getAccessTokenCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}
