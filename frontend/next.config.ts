import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only: Next.js blocks cross-origin requests to its own internal
  // dev assets (chiefly the HMR/live-reload websocket) unless the
  // requesting host is listed here — see node_modules/next/dist/docs/
  // .../allowedDevOrigins.md. This does NOT gate normal page loads,
  // API calls, or any customer-facing behavior (those don't carry an
  // Origin header for /_next/* asset requests) — it only restores
  // live-reload while viewing the site through this address. Update
  // this value (and restart) if this host's IP changes on a new
  // network; matching only supports an exact host or *.subdomain
  // wildcard, not a general wildcard, so there's no way to make this
  // one entry itself network-independent.
  allowedDevOrigins: ["192.168.137.107"],
};

export default nextConfig;
