"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import { useLanguage } from "@/lib/context/LanguageContext";
import { memberVerificationsTranslations } from "@/constants/translations/member-verifications";
import { commonTranslations } from "@/constants/translations/common";
import { API_URL } from "@/lib/utils/api";

interface Verification {
  verification_id: number;
  verification_method: string;
  verification_result: string;
  member_status: string | null;
  verified_date: string;
  remarks: string | null;
  hospital_id: number;
  hospital_name: string;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-TZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VerificationsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = memberVerificationsTranslations[language];
  const common = commonTranslations[language];

  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API_URL}/members/verifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (response.status === 401) {
          router.push("/login");
          return null;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || t.errorFallback);
        }

        return data;
      })
      .then((data) => data && setVerifications(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : t.errorFallback)
      )
      .finally(() => setLoading(false));
  }, [router, t.errorFallback]);

  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-3xl mx-auto">

        <Link
          href="/dashboard"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← {common.backToDashboard}
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          {t.heading}
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          {t.subtitle}
        </p>

        {error && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="mt-8 text-gray-500">{common.loading}</p>

        ) : verifications.length === 0 ? (

          <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
            <p className="text-gray-600">
              {t.noVerifications}
            </p>
            <p className="mt-2 text-sm text-gray-400">
              {t.noVerificationsHelp}
            </p>
          </div>

        ) : (

          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">

            <table className="w-full text-left text-sm">

              <thead className="bg-white text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">{t.date}</th>
                  <th className="px-6 py-3 font-semibold">{t.hospital}</th>
                  <th className="px-6 py-3 font-semibold">{t.method}</th>
                  <th className="px-6 py-3 font-semibold">{t.result}</th>
                  <th className="px-6 py-3 font-semibold">{t.remarks}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {verifications.map((verification) => (

                  <tr key={verification.verification_id}>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(verification.verified_date)}
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {verification.hospital_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {verification.verification_method}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {verification.verification_result}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {verification.remarks || "—"}
                    </td>
                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}
