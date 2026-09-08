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
import { LogoMark } from "@/components/common/Logo";
import { API_URL } from "@/lib/utils/api";

const NAV_LINKS = [
  { href: "/", labelKey: "home" as const },
  { href: "/about", labelKey: "about" as const },
  { href: "/services", labelKey: "services" as const },
];

// The Home nav item is icon-only (see NAV_LINKS rendering below) while every
// other item stays text — this is the one icon shared between the desktop
// and mobile nav markup, so it's extracted instead of duplicated inline like
// the header's other one-off SVGs.
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  );
}

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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to an external signal (auth/role state), not derivable during render
      setNeedsMembershipCompletion(false);
      return;
    }

    const token = getAccessToken();

    if (!token) {
      return;
    }

    fetch(`${API_URL}/members/me`, {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to an external signal (route change), not derivable during render
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    router.push("/login");
  };

  return (
    <header className="bg-emerald-900/95 backdrop-blur-sm border-b border-emerald-800 fixed top-0 left-0 w-full z-50 pt-[env(safe-area-inset-top,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]">
      {/* pt-/pl-/pr- above are on the fixed bar itself (not this inner
          content div) so the dark background still fills the notch/
          corner area edge-to-edge and only the actual content shifts
          inward — same pattern as Sidebar.tsx's mobile top bar. */}

      <div className="max-w-7xl mx-auto px-6 py-4 max-md:px-4 max-md:py-3 flex items-center justify-between">

        {/* Logo */}
        <div className="min-w-0">
          <Link
            href="/"
            className="group flex items-center gap-2 text-2xl font-bold text-white"
          >
            <LogoMark className="h-7 w-7 shrink-0" />
            Tujitunze
          </Link>

          <p className="text-xs text-emerald-200 max-md:max-w-[11rem] max-md:truncate">
            {t.tagline}
          </p>
        </div>

        {/* Navigation Menu (desktop) */}
        <nav className="hidden md:flex items-center space-x-8">

          {NAV_LINKS.map((link) =>
            link.href === "/" ? (
              <Link
                key={link.href}
                href={link.href}
                aria-label={t.home}
                title={t.home}
                className="text-white transition-colors duration-300 ease-in-out hover:text-emerald-300"
              >
                <HomeIcon className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-white transition-colors duration-300 ease-in-out hover:text-emerald-300"
              >
                {t[link.labelKey]}
              </Link>
            )
          )}

        </nav>

        <div className="flex items-center gap-3">

          {/* Language Toggle */}
          <LanguageSwitcher />

          {/* Authentication Buttons (desktop) — hidden on mobile since the
              profile menu below relies on :hover, which doesn't work on a
              touch device; the hamburger panel covers mobile instead. */}
          <div className="hidden md:flex items-center gap-3">

            {isAuthenticated ? (

              <div className="relative group">

                <button
                  type="button"
                  className="
                  flex
                  items-center
                  gap-2
                  border
                  border-white
                  text-white
                  px-5 py-2
                  rounded-lg
                  group-hover:bg-white
                  group-hover:text-emerald-900
                  transition-colors duration-300 ease-in-out"
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
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600"
                    >
                      {t.profile}
                    </Link>

                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600"
                    >
                      {t.settings}
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600"
                    >
                      {t.logOut}
                    </button>

                  </div>

                </div>

              </div>

            ) : (

              <>
                <Link
                  href="/login"
                  className="
                  text-white
                  font-medium
                  px-2 py-2
                  hover:text-emerald-300
                  transition-colors duration-300 ease-in-out"
                >
                  {t.login}
                </Link>

                <Link
                  href="/register"
                  className="
                  bg-black
                  text-white
                  font-semibold
                  px-4 py-2
                  rounded-md
                  hover:bg-gray-900
                  transition-colors duration-300 ease-in-out"
                >
                 {t.getStarted}
                </Link>
              </>

            )}

          </div>

          {/* Hamburger toggle (mobile only) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? commonT.closeMenu : commonT.openMenu}
            aria-expanded={mobileMenuOpen}
            className="md:hidden rounded-lg p-2.5 text-white transition-colors duration-300 ease-in-out hover:bg-white/10 hover:text-emerald-300"
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
        <div className="md:hidden border-t border-emerald-800 bg-emerald-900 px-4 py-4">

          <nav className="flex flex-col space-y-1">

            {NAV_LINKS.map((link) =>
              link.href === "/" ? (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-label={t.home}
                  title={t.home}
                  className="flex items-center rounded-lg px-3 py-2 text-white transition-colors duration-300 ease-in-out hover:bg-emerald-800 hover:text-emerald-300"
                >
                  <HomeIcon className="h-5 w-5" />
                </Link>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors duration-300 ease-in-out hover:bg-emerald-800 hover:text-emerald-300"
                >
                  {t[link.labelKey]}
                </Link>
              )
            )}

          </nav>

          <div className="mt-3 border-t border-emerald-800 pt-3">

            {isAuthenticated ? (

              <div className="flex flex-col space-y-1">

                {firstName && (
                  <p className="px-3 pb-1 text-sm font-semibold text-white">
                    {firstName}
                  </p>
                )}

                {needsMembershipCompletion && (
                  <Link
                    href="/onboarding/mobile-money"
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-900/40"
                  >
                    {t.completeMembership}
                  </Link>
                )}

                <Link
                  href="/profile"
                  className="rounded-lg px-3 py-2 text-sm text-white transition-colors duration-300 ease-in-out hover:bg-emerald-800 hover:text-emerald-300"
                >
                  {t.profile}
                </Link>

                <Link
                  href="/settings"
                  className="rounded-lg px-3 py-2 text-sm text-white transition-colors duration-300 ease-in-out hover:bg-emerald-800 hover:text-emerald-300"
                >
                  {t.settings}
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-2 text-left text-sm text-white transition-colors duration-300 ease-in-out hover:bg-emerald-800 hover:text-emerald-300"
                >
                  {t.logOut}
                </button>

              </div>

            ) : (

              <div className="flex flex-col gap-2">

                <Link
                  href="/login"
                  className="rounded-lg border-2 border-white px-4 py-2 text-center text-sm font-semibold text-white hover:bg-white hover:text-emerald-900 transition-colors duration-300 ease-in-out"
                >
                  {t.login}
                </Link>

                <Link
                  href="/register"
                  className="rounded-md bg-black px-4 py-2 text-center text-sm font-semibold text-white hover:bg-gray-900 transition-colors duration-300 ease-in-out"
                >
                  {t.getStarted}
                </Link>

              </div>

            )}

          </div>

        </div>
      )}

    </header>
  );
}
