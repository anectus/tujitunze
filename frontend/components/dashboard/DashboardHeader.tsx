"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/hooks/useAuth";
import { useLanguage } from "@/lib/context/LanguageContext";
import { commonTranslations } from "@/constants/translations/common";

interface DashboardHeaderProps {
  title: string;
}

// Mounted at the top of every staff dashboard page (Admin, Bank, Telecom,
// Insurance, Super-admin). Log out lives here — in a standard top-right
// account menu — in addition to Sidebar.tsx's own copy at the bottom of
// the nav, so it's reachable from the page itself without opening the
// sidebar (or, on mobile, the hamburger drawer) first.
export default function DashboardHeader({ title }: DashboardHeaderProps) {
  const router = useRouter();
  const { firstName, logout } = useAuth();
  const { language } = useLanguage();
  const t = commonTranslations[language];

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    logout();
    router.push("/login");
  };

  return (
    <header className="border-b border-gray-100 bg-white px-4 py-4 sm:px-8">

      <div className="flex items-center justify-between">

        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          {title}
        </h1>

        <div ref={rootRef} className="relative">

          <button
            type="button"
            onClick={() => setOpen((previous) => !previous)}
            aria-haspopup="menu"
            aria-expanded={open}
            className="
            flex
            items-center
            gap-2
            rounded-lg
            px-2 py-1.5
            text-gray-600
            transition
            hover:bg-gray-50
            hover:text-blue-700"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              {(firstName?.[0] ?? "?").toUpperCase()}
            </span>

            {firstName && (
              <span className="hidden text-sm font-medium text-gray-700 sm:inline">
                {firstName}
              </span>
            )}

            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
              className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>

          {open && (
            <div
              role="menu"
              className="
              absolute
              right-0
              top-full
              z-10
              mt-2
              w-44
              overflow-hidden
              rounded-lg
              border
              border-gray-100
              bg-white
              py-1
              shadow-xl"
            >
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-700"
              >
                {t.logOut}
              </button>
            </div>
          )}

        </div>

      </div>

    </header>
  );
}
