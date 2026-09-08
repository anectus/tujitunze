"use client";

import { useEffect, useState } from "react";

import Sidebar, { SidebarNavItem } from "@/components/common/Sidebar";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import type { roleLabelTranslations } from "@/constants/translations/common";

interface DashboardLayoutProps {
  roleLabel: keyof (typeof roleLabelTranslations)["en"];
  navItems: readonly SidebarNavItem[];
  children: React.ReactNode;
}

const COLLAPSED_STORAGE_KEY = "tujitunze_sidebar_collapsed";

// Persistent chrome for every staff route group (Admin, Super-admin,
// Bank, Telecom, Insurance) — mounted once in each group's
// layout.tsx so the sidebar's own links never leave the shell partway
// through navigation. Owns the desktop collapse state so Sidebar's own
// width and this component's content padding never drift out of sync.
export default function DashboardLayout({
  roleLabel,
  navItems,
  children,
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reads a browser-only API; must stay false on the server render to avoid a hydration mismatch, then sync once mounted
      setCollapsed(localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1");
    } catch {
      // localStorage can throw in a locked-down browsing context — the
      // sidebar just stays expanded, no functional loss.
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((previous) => {
      const next = !previous;
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Same as above — persistence is a nicety, not a requirement.
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <Sidebar
        roleLabel={roleLabel}
        navItems={navItems}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />

      {/* pt- matches the mobile top bar's own height + its safe-area
          top inset (Sidebar.tsx changed that bar from h-14 to min-h-14
          so a notch can grow it taller) — otherwise a notched phone's
          taller bar would overlap the first bit of page content.
          pb- gives scrollable content some clearance above the home-
          indicator area instead of the last row sitting flush against
          it. Both env() calls no-op to 0 on a non-notched device. */}
      <div
        className={`flex min-h-screen flex-col pt-[calc(3.5rem+env(safe-area-inset-top,0px))] pb-[env(safe-area-inset-bottom,0px)] md:pt-0 transition-[padding] duration-200 ${
          collapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        <div className="flex-1">{children}</div>
        <DashboardFooter />
      </div>

    </div>
  );
}
