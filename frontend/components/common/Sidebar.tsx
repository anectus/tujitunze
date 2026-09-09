"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/lib/hooks/useAuth";
import { getStaffDashboardPath } from "@/lib/utils/permissions";
import { useLanguage } from "@/lib/context/LanguageContext";
import {
  commonTranslations,
  navLabelTranslations,
  roleLabelTranslations,
} from "@/constants/translations/common";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import Logo from "@/components/common/Logo";
import {
  ChevronDoubleLeftIcon,
  LogoutIcon,
  NAV_ICONS,
} from "@/components/common/SidebarIcons";

export interface SidebarNavItem {
  labelKey: keyof (typeof navLabelTranslations)["en"];
  href: string;
}

interface SidebarProps {
  roleLabel: keyof (typeof roleLabelTranslations)["en"];
  navItems: readonly SidebarNavItem[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export default function Sidebar({
  roleLabel,
  navItems,
  collapsed,
  onToggleCollapsed,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { firstName, roles, logout } = useAuth();
  const { language } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sidebar is shared by every role group — a bare "/super-admin/dashboard"
  // link would send a Bank/Telecom/Insurance/Admin/Member staffer to a
  // page their own role can't reach (a 403-equivalent access-denied
  // redirect). getStaffDashboardPath already knows the right landing page
  // per role; Member (no entry in that map) falls back to its own bare
  // "/dashboard".
  const logoHref = getStaffDashboardPath(roles) ?? (roles.includes("Member") ? "/dashboard" : "/");

  const navLabels = navLabelTranslations[language];
  const roleLabels = roleLabelTranslations[language];
  const t = commonTranslations[language];

  // Close the drawer on route changes so a nav tap doesn't leave it open
  // behind the newly-loaded page.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to an external signal (route change), not derivable during render
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    router.push("/login");
  };

  // isCompact only ever applies to the fixed desktop rail — the mobile
  // drawer (below md) always renders full labels since it already
  // collapses to nothing (hidden) when closed.
  const sidebarBody = (onNavigate?: () => void, isCompact = false) => (
    <>
      <div
        className={`border-b border-gray-100 ${
          // `mx-auto` (the old collapsed styling) never actually centers
          // Logo's root element here — that root is `inline-flex`, and
          // per the CSS box model, `margin: auto` only resolves to a
          // non-zero value for a block-level box in normal flow (or a
          // flex/grid item) — on an inline-level box it computes to 0.
          // So the collapsed shield was quietly left-aligned inside this
          // div the whole time, off by however much horizontal padding
          // the div itself had. Making the div the flex container (with
          // items-center + justify-center) sidesteps that entirely: it
          // centers its child regardless of the child's own display
          // type, which is the actually-reliable technique here.
          isCompact
            ? "flex items-center justify-center px-1 py-4"
            : "px-2 py-6"
        }`}
      >
        <Logo
          href={logoHref}
          collapsed={isCompact}
          onNavigate={onNavigate}
          className={isCompact ? "" : "mx-4"}
        />
        {!isCompact && (
          <div className="mx-4">
            {firstName && (
              <p className="mt-3 truncate text-sm font-medium text-gray-700">
                {firstName}
              </p>
            )}
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {roleLabels[roleLabel] ?? roleLabel}
            </p>
          </div>
        )}
      </div>

      <nav
        className={`flex-1 overflow-y-auto py-4 space-y-1 ${
          isCompact ? "px-2" : "px-3"
        }`}
      >
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const ItemIcon = NAV_ICONS[item.labelKey];
          const label = navLabels[item.labelKey] ?? item.labelKey;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={isCompact ? label : undefined}
              aria-label={label}
              className={`
              flex
              items-center
              gap-3
              rounded-lg
              px-3 py-2
              text-sm
              font-medium
              transition
              ${isCompact ? "justify-center" : ""}
              ${
                isActive
                  ? "bg-emerald-50 text-[#064E3B] font-semibold"
                  : "text-slate-600 hover:bg-gray-50 hover:text-[#064E3B]"
              }`}
            >
              <ItemIcon className="h-5 w-5 shrink-0" />
              {!isCompact && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div
        className={`border-t border-gray-100 py-4 space-y-2 ${
          isCompact ? "px-2" : "px-3"
        }`}
      >
        {!isCompact && <LanguageSwitcher className="w-full" />}
        <button
          type="button"
          onClick={handleLogout}
          title={isCompact ? t.logOut : undefined}
          aria-label={t.logOut}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-gray-50 hover:text-[#064E3B] ${
            isCompact ? "justify-center" : "text-left"
          }`}
        >
          <LogoutIcon className="h-5 w-5 shrink-0" />
          {!isCompact && <span>{t.logOut}</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar — the sidebar proper is hidden below md, so this
          fixed bar + toggle button is the only way to reach it on a phone
          screen. This is the sidebar's "collapsed" state on small screens:
          it opens into the full drawer below on demand and stays out of
          the way otherwise. */}
      {/* min-h-14 (not h-14) so the safe-area top inset grows the bar
          instead of squeezing its fixed-height content on a notched
          phone; pl-/pr- keep the logo and hamburger clear of a curved
          corner in landscape. Falls back to 0 via env()'s second
          argument on a browser/device with no notch, so this is a no-op
          everywhere else. */}
      <div className="md:hidden fixed inset-x-0 top-0 z-40 flex min-h-14 items-center justify-between border-b border-gray-100 bg-white px-2 pt-[env(safe-area-inset-top,0px)] pl-[calc(0.5rem+env(safe-area-inset-left,0px))] pr-[calc(0.5rem+env(safe-area-inset-right,0px))]">

        <Logo href={logoHref} />

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label={t.openMenu}
          aria-expanded={mobileOpen}
          className="rounded-lg p-2 text-slate-600 transition hover:bg-gray-50 hover:text-[#064E3B]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden="true"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
            />
          </svg>
        </button>

      </div>

      {/* Mobile overlay + slide-in drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">

          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">

            <div className="flex items-center justify-end px-3 pt-3">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label={t.closeMenu}
                className="rounded-lg p-2 text-slate-600 transition hover:bg-gray-50 hover:text-[#064E3B]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  aria-hidden="true"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {sidebarBody(() => setMobileOpen(false))}

          </aside>

        </div>
      )}

      {/* Desktop sidebar — background matches DashboardHeader's bg-white /
          border-gray-100 chrome so the two read as one shell; brand green
          shows up in the active nav state and logo mark, slate gray in
          secondary text, per the Tujitunze palette. Collapses to an
          icon-only rail (own width managed here; DashboardLayout mirrors
          it for the content column's left padding). */}
      <aside
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 border-r border-gray-100 bg-white transition-[width] duration-200 ${
          collapsed ? "md:w-20" : "md:w-64"
        }`}
      >
        {sidebarBody(undefined, collapsed)}

        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? t.openMenu : t.closeMenu}
          title={collapsed ? t.openMenu : t.closeMenu}
          className="absolute -right-3 top-8 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-slate-500 shadow-sm transition hover:text-[#064E3B]"
        >
          <ChevronDoubleLeftIcon
            className={`h-3.5 w-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </aside>
    </>
  );
}
