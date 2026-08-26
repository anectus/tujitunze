"use client";

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

  const navLabels = navLabelTranslations[language];
  const roleLabels = roleLabelTranslations[language];
  const t = commonTranslations[language];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-gray-100 bg-white">

      <div className="px-6 py-6 border-b border-gray-100">
        <Link href="/" className="text-xl font-bold text-blue-700">
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
              className={`
              block
              rounded-lg
              px-3 py-2
              text-sm
              font-medium
              transition
              ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-blue-700"
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
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-blue-700"
        >
          {t.logOut}
        </button>
      </div>

    </aside>
  );
}
