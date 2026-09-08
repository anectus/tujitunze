"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/lib/context/LanguageContext";
import { commonTranslations, navLabelTranslations } from "@/constants/translations/common";
import { getAccessToken } from "@/lib/utils/permissions";
import { API_URL } from "@/lib/utils/api";
import {
  BellIcon,
  ShieldIcon,
  SignalIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/common/SidebarIcons";

function SearchIcon({ className }: { className?: string }) {
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
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="20" y1="20" x2="15.3" y2="15.3" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

interface SearchResultItem {
  id: number;
  title: string;
  subtitle: string;
  href: string;
}

interface SearchResults {
  members: SearchResultItem[];
  wallet: SearchResultItem[];
  insurance: SearchResultItem[];
  telecom: SearchResultItem[];
  notifications: SearchResultItem[];
}

const EMPTY_RESULTS: SearchResults = {
  members: [],
  wallet: [],
  insurance: [],
  telecom: [],
  notifications: [],
};

// Order controls both display order and which categories render at all —
// a category with an empty array for the current caller's role (see
// backend/src/modules/search/search.service.ts's per-role scoping) just
// doesn't show a heading, rather than showing an empty one.
const CATEGORY_ORDER: {
  key: keyof SearchResults;
  labelKey: keyof (typeof navLabelTranslations)["en"];
  icon: typeof UsersIcon;
}[] = [
  { key: "members", labelKey: "members", icon: UsersIcon },
  { key: "wallet", labelKey: "wallet", icon: WalletIcon },
  { key: "insurance", labelKey: "insurance", icon: ShieldIcon },
  { key: "telecom", labelKey: "telecom", icon: SignalIcon },
  { key: "notifications", labelKey: "notifications", icon: BellIcon },
];

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

// The mobile overlay below is `absolute inset-x-0 top-0`, sized to span
// whatever positioned ancestor contains it — the caller (DashboardHeader)
// needs `position: relative` on its own <header> for that to span the
// full header row rather than escaping to whatever positioned ancestor
// happens to be further up the tree.
interface SearchBarProps {
  className?: string;
}

// Reusable across every authenticated header (currently: DashboardHeader).
// Desktop/tablet (sm and up): a persistent input. Below sm: collapses to
// an icon button that expands into an inline overlay input — a full
// modal dialog (focus trap, backdrop, escape-to-close semantics) is
// disproportionate for what's still a lightweight dropdown; this gets
// the same "tap icon → type" UX with far less machinery to get wrong.
export default function SearchBar({ className = "" }: SearchBarProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const t = commonTranslations[language];
  const navLabels = navLabelTranslations[language];

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  // Cmd/Ctrl+/ focuses the search box, wherever it's mounted — self-
  // contained so no parent header has to wire this up per page.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "/") {
        event.preventDefault();
        if (window.innerWidth < 640) {
          setMobileOpen(true);
        } else {
          desktopInputRef.current?.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      mobileInputRef.current?.focus();
    }
  }, [mobileOpen]);

  // Click-outside / Escape closes the results dropdown — same pattern
  // DashboardHeader's own account-menu uses.
  useEffect(() => {
    if (!dropdownOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  // Debounced fetch — 300ms after the last keystroke, and only once the
  // query clears the backend's own minimum length (matching
  // SearchQueryDto's @MinLength(2), so a 1-character query never fires a
  // request that would just come back 400 anyway).
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale results when the query drops below the backend's own minimum length, not a value derivable during render
      setResults(null);
      setError("");
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const token = getAccessToken();
      if (!token) {
        return;
      }

      const thisRequestId = ++requestIdRef.current;
      setLoading(true);
      setError("");

      fetch(`${API_URL}/search?q=${encodeURIComponent(trimmed)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (response) => {
          const body = await response.json();
          if (!response.ok) {
            throw new Error(body.message || t.somethingWentWrong);
          }
          return body as SearchResults;
        })
        .then((body) => {
          // A slower earlier request finishing after a faster later one
          // would otherwise stomp the newer, more relevant results.
          if (thisRequestId === requestIdRef.current) {
            setResults(body);
            setDropdownOpen(true);
          }
        })
        .catch((err) => {
          if (thisRequestId === requestIdRef.current) {
            setError(err instanceof Error ? err.message : t.somethingWentWrong);
            setResults(EMPTY_RESULTS);
            setDropdownOpen(true);
          }
        })
        .finally(() => {
          if (thisRequestId === requestIdRef.current) {
            setLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, t.somethingWentWrong]);

  const handleSelect = (item: SearchResultItem) => {
    setDropdownOpen(false);
    setMobileOpen(false);
    setQuery("");
    setResults(null);
    router.push(item.href);
  };

  const hasAnyResults =
    !!results && CATEGORY_ORDER.some(({ key }) => results[key].length > 0);

  const inputClasses =
    "w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 transition-shadow duration-200 ease-in-out focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500";

  // Shared between the desktop (floating card) and mobile (inline panel)
  // layouts — only the wrapping container's positioning classes differ
  // between the two call sites below.
  const renderResultsList = () => (
    <>
      {loading && !results && (
        <p className="px-4 py-3 text-sm text-gray-500">{t.loading}</p>
      )}

      {error && <p className="px-4 py-3 text-sm text-red-700">{error}</p>}

      {!error && results && !hasAnyResults && !loading && (
        <p className="px-4 py-3 text-sm text-gray-500">{t.noDataFound}</p>
      )}

      {!error &&
        results &&
        CATEGORY_ORDER.map(({ key, labelKey, icon: Icon }) => {
          const items = results[key];
          if (items.length === 0) {
            return null;
          }

          return (
            <div key={key} className="py-1">
              <p className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {navLabels[labelKey]}
              </p>
              {items.map((item) => (
                <button
                  key={`${key}-${item.id}`}
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => handleSelect(item)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left transition hover:bg-gray-50"
                >
                  <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-900">
                      {item.title}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {item.subtitle}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          );
        })}
    </>
  );

  const showDropdown = dropdownOpen && (loading || error || !!results);

  return (
    <div ref={rootRef} className="relative">
      {/* Desktop/tablet: persistent input */}
      <div className={`relative hidden sm:block ${className}`}>
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={desktopInputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => results && setDropdownOpen(true)}
          placeholder={t.search}
          aria-label={t.search}
          className={inputClasses}
        />
        {showDropdown && (
          <div
            role="listbox"
            className="absolute left-0 right-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded-lg border border-gray-100 bg-white py-2 shadow-xl"
          >
            {renderResultsList()}
          </div>
        )}
      </div>

      {/* Mobile: icon button that expands into an overlay input */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label={t.search}
          className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-50 hover:text-[#064E3B]"
        >
          <SearchIcon className="h-5 w-5" />
        </button>

        {mobileOpen && (
          <div className="absolute inset-x-0 top-0 z-20 border-b border-gray-100 bg-white">
            <div className="flex h-14 items-center gap-2 px-4">
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  ref={mobileInputRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t.search}
                  aria-label={t.search}
                  className={inputClasses}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setDropdownOpen(false);
                }}
                aria-label={t.close}
                className="shrink-0 rounded-lg p-2 text-gray-600 transition hover:bg-gray-50 hover:text-[#064E3B]"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            {showDropdown && (
              <div
                role="listbox"
                className="max-h-96 overflow-y-auto border-t border-gray-100 py-2"
              >
                {renderResultsList()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
