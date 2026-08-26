"use client";

import { useEffect } from "react";

import { useLanguage } from "@/lib/context/LanguageContext";
import { errorPageTranslations } from "@/constants/translations/system-pages";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { language } = useLanguage();
  const t = errorPageTranslations[language];

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <h1 className="mb-4 text-3xl font-bold text-red-600">
          {t.title}
        </h1>

        <p className="mb-6 text-gray-600">
          {t.description}
        </p>

        <button
          onClick={() => reset()}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          {t.tryAgain}
        </button>
      </div>
    </main>
  );
}
