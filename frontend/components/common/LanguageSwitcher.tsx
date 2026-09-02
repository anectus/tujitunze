"use client";

import { useEffect, useRef, useState } from "react";

import { useLanguage, type Language } from "@/lib/context/LanguageContext";
import { commonTranslations } from "@/constants/translations/common";

interface LanguageSwitcherProps {
  className?: string;
}

// Language names are autonyms (each language's own name for itself), so
// they stay the same regardless of which language the rest of the UI is
// currently showing — this list is intentionally not run through the
// translation tables.
const LANGUAGE_OPTIONS: { code: Language; label: string; shortLabel: string }[] = [
  { code: "sw", label: "Swahili", shortLabel: "SW" },
  { code: "en", label: "English", shortLabel: "EN" },
];

// Single canonical language selector — mounted in Header (public pages),
// Sidebar (all 6 staff dashboards), and the chromeless auth pages, so the
// control is reachable everywhere the global LanguageContext applies.
export default function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const t = commonTranslations[language];
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current =
    LANGUAGE_OPTIONS.find((option) => option.code === language) ??
    LANGUAGE_OPTIONS[1];

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

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-label={t.changeLanguage}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="
        flex
        w-full
        items-center
        justify-center
        gap-2
        border
        border-gray-200
        bg-white
        text-gray-700
        px-3 py-2
        rounded-lg
        text-sm
        font-semibold
        hover:border-blue-700
        hover:text-blue-700
        transition"
      >
        <span className="hidden md:inline">{current.label}</span>
        <span className="md:hidden">{current.shortLabel}</span>

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
        <ul
          role="listbox"
          aria-label={t.changeLanguage}
          className="
          absolute
          right-0
          z-20
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
          {LANGUAGE_OPTIONS.map((option) => {
            const isSelected = option.code === language;

            return (
              <li key={option.code} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => handleSelect(option.code)}
                  className={`
                  flex
                  w-full
                  items-center
                  gap-2.5
                  px-4 py-2.5
                  text-left
                  text-sm
                  transition
                  ${
                    isSelected
                      ? "bg-blue-50 font-semibold text-blue-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-blue-700"
                  }`}
                >
                  <span>{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
