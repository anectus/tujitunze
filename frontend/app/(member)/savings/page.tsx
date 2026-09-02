"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import { useLanguage } from "@/lib/context/LanguageContext";
import { commonTranslations } from "@/constants/translations/common";
import { memberSavingsTranslations } from "@/constants/translations/member-savings";
import { API_URL } from "@/lib/utils/api";

interface RecentEntry {
  ledgerId: number;
  principle: "RESOURCE_CONVERSION" | "TRANSACTION_DIVERSION";
  source: string;
  savedValueTzs: number;
  createdAt: string;
}

interface SavingsSummary {
  totalSavedTzs: number;
  resourceConversion: { count: number; totalSavedTzs: number };
  transactionDiversion: { count: number; totalSavedTzs: number };
  recent: RecentEntry[];
}

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ", { minimumFractionDigits: 2 })}`;
}

export default function SavingsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = memberSavingsTranslations[language];
  const common = commonTranslations[language];

  const [summary, setSummary] = useState<SavingsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API_URL}/members/savings-summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || t.loadError);
        return data;
      })
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : t.loadError))
      .finally(() => setLoading(false));
  }, [router, t.loadError]);

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← {common.backToDashboard}
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">{t.title}</h1>
        <p className="mt-2 max-w-xl text-gray-600">{t.subtitle}</p>

        {error && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-8 text-gray-500">{common.loading}</p>
        ) : summary ? (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-md">
                <p className="text-sm font-medium text-blue-700">{t.totalSaved}</p>
                <p className="mt-2 text-3xl font-bold text-blue-900">
                  {formatTsh(summary.totalSavedTzs)}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
                <p className="text-sm font-medium text-gray-500">{t.resourceConversion}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatTsh(summary.resourceConversion.totalSavedTzs)}
                </p>
                <p className="mt-1 text-xs text-gray-400">{t.resourceConversionHint}</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
                <p className="text-sm font-medium text-gray-500">{t.transactionDiversion}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatTsh(summary.transactionDiversion.totalSavedTzs)}
                </p>
                <p className="mt-1 text-xs text-gray-400">{t.transactionDiversionHint}</p>
              </div>
            </div>

            <h2 className="mt-10 text-lg font-bold text-gray-900">{t.recentTitle}</h2>

            {summary.recent.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
                <p className="text-gray-600">{t.emptyTitle}</p>
                <p className="mt-2 text-sm text-gray-400">{t.emptyBody}</p>
              </div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">
                <ul className="divide-y divide-gray-100">
                  {summary.recent.map((entry) => (
                    <li
                      key={entry.ledgerId}
                      className="flex items-center justify-between gap-4 px-6 py-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {entry.principle === "RESOURCE_CONVERSION"
                            ? t.resourceLabel
                            : t.transactionLabel}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {new Date(entry.createdAt).toLocaleString("en-TZ")}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-green-700">
                        +{formatTsh(entry.savedValueTzs)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
