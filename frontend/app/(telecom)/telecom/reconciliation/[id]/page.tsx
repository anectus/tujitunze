"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useLanguage } from "@/lib/context/LanguageContext";
import { commonTranslations } from "@/constants/translations/common";
import { telecomReconciliationDetailTranslations } from "@/constants/translations/telecom-reconciliation-detail";

interface RecordRow {
  record_id: number;
  external_reference: string;
  amount: string;
  record_date: string | null;
  matched_contribution_id: number | null;
  match_status: string;
}

interface RunDetail {
  run_id: number;
  total_uploaded: number;
  matched_count: number;
  unmatched_count: number;
  run_date: string;
  records: RecordRow[];
}

export default function ReconciliationRunDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const t = telecomReconciliationDetailTranslations[language];
  const common = commonTranslations[language];

  const [run, setRun] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`http://localhost:3002/telecom/reconciliation/runs/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || t.loadError);
        }

        return data;
      })
      .then(setRun)
      .catch((err) =>
        setError(err instanceof Error ? err.message : t.loadError)
      )
      .finally(() => setLoading(false));
  }, [params.id, router]);

  return (
    <div>

      <DashboardHeader title={run ? t.headerTitleWithId(run.run_id) : t.headerTitle} />

      <div className="p-4 sm:p-8">

        <Link
          href="/telecom/reconciliation"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          {t.backLink}
        </Link>

        {error && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="mt-6 text-gray-500">{common.loading}</p>

        ) : run ? (

          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
                <p className="text-sm text-gray-500">{t.uploaded}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{run.total_uploaded}</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
                <p className="text-sm text-gray-500">{t.matched}</p>
                <p className="mt-1 text-2xl font-bold text-green-700">{run.matched_count}</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
                <p className="text-sm text-gray-500">{t.unmatched}</p>
                <p className="mt-1 text-2xl font-bold text-red-700">{run.unmatched_count}</p>
              </div>

            </div>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

              <table className="w-full text-left text-sm">

                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">{t.reference}</th>
                    <th className="px-6 py-3 font-semibold">{t.amount}</th>
                    <th className="px-6 py-3 font-semibold">{t.matchedContribution}</th>
                    <th className="px-6 py-3 font-semibold">{common.status}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {run.records.map((record) => (
                    <tr key={record.record_id}>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {record.external_reference}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        TSh {Number(record.amount).toLocaleString("en-TZ")}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {record.matched_contribution_id ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            record.match_status === "Matched"
                              ? "text-green-700"
                              : "text-red-700"
                          }
                        >
                          {record.match_status === "Matched" ? t.matchStatusMatched : t.matchStatusUnmatched}
                        </span>
                      </td>
                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          </>

        ) : null}

      </div>

    </div>
  );
}
