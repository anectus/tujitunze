"use client";

import Link from "next/link";

// The one real Tujitunze brand mark in this codebase — a shield-with-
// cross, matching the health/security positioning — previously defined
// only as a private, unexported function inside Header.tsx (the public
// marketing site's header) and used nowhere else. Exported from here so
// Header.tsx and every authenticated page's Sidebar/DashboardHeader
// render the exact same mark instead of two different ones drifting
// apart. Colors are the app's actual established greens (#6ee7b7 /
// #a7f3d0 fills, #064e3b stroke) — not a different "brand green" hex,
// since this already matches every other emerald-toned element site-wide.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      // group-hover here relies on the parent Link's `group` class (see
      // Logo below) — Header.tsx/Footer.tsx use this mark directly with
      // their own Link, which also carries `group`, so the hover state
      // still comes from a real ancestor rather than needing this SVG
      // itself to be interactive.
      className={`transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(6,78,59,0.5)] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${className ?? ""}`}
    >
      <path
        d="M12 2 L20 5.2 C20 12.4 16.8 18.2 12 21 C7.2 18.2 4 12.4 4 5.2 Z"
        fill="#6ee7b7"
      />
      <path
        d="M12 4.3 L17.6 6.5 C17.6 11.8 15.3 16 12 18.2 C8.7 16 6.4 11.8 6.4 6.5 Z"
        fill="#a7f3d0"
      />
      <g stroke="#064e3b" strokeWidth="1.6" strokeLinecap="round">
        <line x1="12" y1="8.6" x2="12" y2="14" />
        <line x1="9.3" y1="11.3" x2="14.7" y2="11.3" />
      </g>
    </svg>
  );
}

interface LogoProps {
  href: string;
  collapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
}

// The Logo every authenticated page renders (Sidebar's desktop rail +
// mobile drawer, DashboardHeader) — a single component so collapsing the
// sidebar animates one continuous element (the shield shrinks, the
// wordmark collapses/fades) instead of swapping between two separately
// mounted pieces. Text is dark-green-on-white (matching Sidebar/
// DashboardHeader's white background) — Header.tsx's own usage of
// LogoMark keeps its own white-on-dark-emerald-900 text, since that's a
// different background context this component doesn't need to cover.
// `href` is passed in by the caller (role-aware — see Sidebar.tsx)
// rather than computed here, since this component doesn't know which
// role's dashboard it should point at.
export default function Logo({
  href,
  collapsed = false,
  onNavigate,
  className = "",
}: LogoProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-label="Tujitunze — go to your dashboard"
      // No default margin baked in here on purpose: mx-4/mx-auto only
      // make sense inside Sidebar's own vertical-stack column (see its
      // call sites) — the same mx-auto would fight DashboardHeader's
      // justify-between flex row if it were a default here instead of an
      // explicit per-caller choice. `group` drives LogoMark's
      // hover scale/glow below.
      className={`group inline-flex items-center ${
        collapsed ? "justify-center" : "gap-2.5"
      } ${className}`}
    >
      <LogoMark className={collapsed ? "h-8 w-8 shrink-0" : "h-10 w-10 shrink-0"} />
      {/* A fixed target width (not w-auto) so the collapse/expand
          transition actually interpolates — CSS can't smoothly animate
          to/from `width: auto`, it just snaps, which would make half of
          "smooth transition effects" a lie. w-28 comfortably fits
          "Tujitunze" at text-xl/font-bold in Inter with room to spare. */}
      <span
        className={`overflow-hidden whitespace-nowrap text-xl font-bold text-[#064E3B] transition-all duration-200 ${
          collapsed ? "w-0 opacity-0" : "w-28 opacity-100"
        }`}
      >
        Tujitunze
      </span>
    </Link>
  );
}

type FixedStateLogoProps = Omit<LogoProps, "collapsed">;

// Fixed-state wrappers for call sites that never collapse (DashboardHeader
// — every page, staff or Member) — Sidebar itself uses <Logo collapsed=.../>
// directly so the expand/collapse transition stays on one element.
export function FullLogo(props: FixedStateLogoProps) {
  return <Logo {...props} collapsed={false} />;
}

export function CompactLogo(props: FixedStateLogoProps) {
  return <Logo {...props} collapsed />;
}
