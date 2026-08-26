"use client";

import { useLanguage } from "@/lib/context/LanguageContext";
import { loadingPageTranslations } from "@/constants/translations/system-pages";

export default function Loading() {
  const { language } = useLanguage();
  const t = loadingPageTranslations[language];

  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

        <h2 className="text-xl font-semibold text-gray-800">
          {t.title}
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          {t.description}
        </p>
      </div>
    </main>
  );
}
