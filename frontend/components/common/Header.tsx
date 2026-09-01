"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/lib/hooks/useAuth";
import { getAccessToken } from "@/lib/utils/permissions";
import { useLanguage } from "@/lib/context/LanguageContext";
import { headerTranslations } from "@/constants/translations/home";
import { commonTranslations } from "@/constants/translations/common";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

const NAV_LINKS = [
  { href: "/", labelKey: "home" as const },
  { href: "/about", labelKey: "about" as const },
  { href: "/services", labelKey: "services" as const },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, roles, firstName, logout } = useAuth();
  const { language } = useLanguage();
  const t = headerTranslations[language];
  const commonT = commonTranslations[language];

  const [needsMembershipCompletion, setNeedsMembershipCompletion] =
    useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Registration only ever collects name/NIDA/phone/password — `region` is
  // set solely by the onboarding/mobile-money form's PATCH /members/me
  // (see MobileMoneyAccountForm.tsx), so its presence is a reliable signal
  // that a member has already been through onboarding at least once. A
  // Member who hasn't yet gets a "Complete Membership" entry here instead
  // of being redirected straight into that form after login.
  useEffect(() => {
    if (!isAuthenticated || !roles.includes("Member")) {
      setNeedsMembershipCompletion(false);
      return;
    }

    const token = getAccessToken();

    if (!token) {
      return;
    }

    fetch("http://localhost:3002/members/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((profile) => setNeedsMembershipCompletion(!!profile && !profile.region))
      .catch(() => setNeedsMembershipCompletion(false));
  }, [isAuthenticated, roles]);

  // Depending on which device (screen size) the visitor is on: below the
  // `md` breakpoint the desktop nav/profile dropdown are hidden and this
  // hamburger-driven panel is the only way to reach them, so close it on
  // every route change rather than leaving it open behind the new page.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    router.push("/login");
  };

  return (
    <header className="bg-white shadow-md fixed top-0 left-0 w-full z-50">

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <div>
          <Link
            href="/"
            className="text-2xl font-bold text-blue-700"
          >
            Tujitunze
          </Link>

          <p className="text-xs text-gray-500">
            {t.tagline}
          </p>
        </div>


        {/* Navigation Menu (desktop) */}
        <nav className="hidden md:flex space-x-8">

          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-700 hover:text-blue-700"
            >
              {t[link.labelKey]}
            </Link>
          ))}

        </nav>


        <div className="flex items-center gap-3">

          {/* Language Toggle */}
          <LanguageSwitcher />

          {/* Authentication Buttons (desktop) — hidden on mobile since the
              profile menu below relies on :hover, which doesn't work on a
              touch device; the hamburger panel covers mobile instead. */}
          <div className="hidden md:block">

            {isAuthenticated ? (

              <div className="relative group">

                <button
                  type="button"
                  className="
                  flex
                  items-center
                  gap-2
                  border
                  border-blue-700
                  text-blue-700
                  px-5 py-2
                  rounded-lg
                  group-hover:bg-blue-700
                  group-hover:text-white
                  transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                  {firstName || "Profile"}
                </button>

                {/* Hover dropdown — pt-2 (not the button's own margin) keeps
                    the hoverable area continuous down to the menu, so moving
                    the cursor from the button into the menu doesn't lose
                    :hover along the way. */}
                <div
                  className="
                  absolute
                  right-0
                  top-full
                  w-48
                  pt-2
                  opacity-0
                  invisible
                  group-hover:opacity-100
                  group-hover:visible
                  transition"
                >

                  <div className="rounded-lg border border-gray-100 bg-white py-2 shadow-xl">

                    {needsMembershipCompletion && (
                      <Link
                        href="/onboarding/mobile-money"
                        className="block px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
                      >
                        {t.completeMembership}
                      </Link>
                    )}

                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-700"
                    >
                      {t.profile}
                    </Link>

                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-700"
                    >
                      {t.settings}
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-700"
                    >
                      {t.logOut}
                    </button>

                  </div>

                </div>

              </div>

            ) : (

              <Link
                href="/register"
                className="
                bg-blue-700
                text-white
                px-5 py-2
                rounded-lg
                hover:bg-blue-800
                transition"
              >
               {t.signUp}
              </Link>

            )}

          </div>

          {/* Hamburger toggle (mobile only) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? commonT.closeMenu : commonT.openMenu}
            aria-expanded={mobileMenuOpen}
            className="md:hidden rounded-lg p-2 text-gray-600 transition hover:bg-gray-50 hover:text-blue-700"
          >
            {mobileMenuOpen ? (
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
            ) : (
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
            )}
          </button>

        </div>

      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4">

          <nav className="flex flex-col space-y-1">

            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-700"
              >
                {t[link.labelKey]}
              </Link>
            ))}

          </nav>

          <div className="mt-3 border-t border-gray-100 pt-3">

            {isAuthenticated ? (

              <div className="flex flex-col space-y-1">

                {firstName && (
                  <p className="px-3 pb-1 text-sm font-semibold text-gray-900">
                    {firstName}
                  </p>
                )}

                {needsMembershipCompletion && (
                  <Link
                    href="/onboarding/mobile-money"
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
                  >
                    {t.completeMembership}
                  </Link>
                )}

                <Link
                  href="/profile"
                  className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-700"
                >
                  {t.profile}
                </Link>

                <Link
                  href="/settings"
                  className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-700"
                >
                  {t.settings}
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-700"
                >
                  {t.logOut}
                </button>

              </div>

            ) : (

              <div className="flex flex-col gap-2">

                <Link
                  href="/login"
                  className="rounded-lg border-2 border-blue-700 px-4 py-2 text-center text-sm font-semibold text-blue-700 hover:bg-blue-700 hover:text-white transition"
                >
                  {t.login}
                </Link>

                <Link
                  href="/register"
                  className="rounded-lg bg-blue-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-800 transition"
                >
                  {t.signUp}
                </Link>

              </div>

            )}

          </div>

        </div>
      )}

    </header>
  );
}
