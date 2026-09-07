"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/lib/hooks/useAuth";
import { useLanguage } from "@/lib/context/LanguageContext";
import {
  commonTranslations,
  navLabelTranslations,
  roleLabelTranslations,
} from "@/constants/translations/common";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

export interface SidebarNavItem {
  labelKey: keyof (typeof navLabelTranslations)["en"];
  href: string;
}

interface SidebarProps {
  roleLabel: keyof (typeof roleLabelTranslations)["en"];
  navItems: readonly SidebarNavItem[];
}

export default function Sidebar({ roleLabel, navItems }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { firstName, logout } = useAuth();
  const { language } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLabels = navLabelTranslations[language];
  const roleLabels = roleLabelTranslations[language];
  const t = commonTranslations[language];

  // Close the drawer on route changes so a nav tap doesn't leave it open
  // behind the newly-loaded page.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    router.push("/login");
  };

  const sidebarBody = (onNavigate?: () => void) => (
    <>
      <div className="px-6 py-6 border-b border-gray-100">
        <Link
          href="/"
          onClick={onNavigate}
          className="text-xl font-bold text-[#064E3B]"
        >
          Tujitunze
        </Link>
        {firstName && (
          <p className="mt-3 truncate text-sm font-medium text-gray-700">
            {firstName}
          </p>
        )}
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
          {roleLabels[roleLabel] ?? roleLabel}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">

        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`
              block
              rounded-lg
              px-3 py-2
              text-sm
              font-medium
              transition
              ${
                isActive
                  ? "bg-emerald-50 text-[#064E3B]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-[#064E3B]"
              }`}
            >
              {navLabels[item.labelKey] ?? item.labelKey}
            </Link>
          );
        })}

      </nav>

      <div className="px-3 py-4 border-t border-gray-100 space-y-2">
        <LanguageSwitcher className="w-full" />
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-[#064E3B]"
        >
          {t.logOut}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar — the sidebar proper is hidden below md, so this
          fixed bar + toggle button is the only way to reach it on a phone
          screen. */}
      <div className="md:hidden fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-gray-100 bg-white px-4">

        <Link href="/" className="text-lg font-bold text-[#064E3B]">
          Tujitunze
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label={t.openMenu}
          aria-expanded={mobileOpen}
          className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-50 hover:text-[#064E3B]"
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
                className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-50 hover:text-[#064E3B]"
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

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-gray-100 bg-white">
        {sidebarBody()}
      </aside>
    </>
  );
}
