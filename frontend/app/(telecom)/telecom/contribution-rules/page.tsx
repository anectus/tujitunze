"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useLanguage } from "@/lib/context/LanguageContext";
import { commonTranslations } from "@/constants/translations/common";
import { telecomContributionRulesTranslations } from "@/constants/translations/telecom-contribution-rules";
import { API_URL } from "@/lib/utils/api";

interface Rule {
  rule_id: number;
  rule_type: string;
  rate_percent: string;
  minimum_amount: string;
  effective_date: string;
  is_active: boolean;
}

export default function ContributionRulesPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = telecomContributionRulesTranslations[language];
  const common = commonTranslations[language];

  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API_URL}/telecom/contribution-rules`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || t.loadError);
        }

        return data;
      })
      .then(setRules)
      .catch((err) =>
        setError(err instanceof Error ? err.message : t.loadError)
      )
      .finally(() => setLoading(false));
  }, [router]);

  const active = rules.filter((r) => r.is_active);
  const history = rules.filter((r) => !r.is_active);

  return (
    <div>

      <DashboardHeader title={t.headerTitle} />

      <div className="p-4 sm:p-8">

        <p className="mb-4 text-sm text-gray-500">
          {t.readOnlyNote}
        </p>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="text-gray-500">{common.loading}</p>

        ) : (

          <div className="space-y-6">

            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">{t.activeRulesHeading}</p>

              <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

                <table className="w-full text-left text-sm">

                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-6 py-3 font-semibold">{t.contributionType}</th>
                      <th className="px-6 py-3 font-semibold">{t.rate}</th>
                      <th className="px-6 py-3 font-semibold">{t.minimumAmount}</th>
                      <th className="px-6 py-3 font-semibold">{t.effectiveDate}</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">

                    {active.map((rule) => (
                      <tr key={rule.rule_id}>
                        <td className="px-6 py-4 font-medium text-gray-900">{rule.rule_type}</td>
                        <td className="px-6 py-4 text-gray-600">{Number(rule.rate_percent).toFixed(2)}%</td>
                        <td className="px-6 py-4 text-gray-600">
                          TSh {Number(rule.minimum_amount).toLocaleString("en-TZ")}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(rule.effective_date).toLocaleDateString("en-TZ")}
                        </td>
                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>
            </div>

            {history.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-700">{t.ruleHistoryHeading}</p>

                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

                  <table className="w-full text-left text-sm">

                    <tbody className="divide-y divide-gray-100">

                      {history.map((rule) => (
                        <tr key={rule.rule_id}>
                          <td className="px-6 py-4 font-medium text-gray-900">{rule.rule_type}</td>
                          <td className="px-6 py-4 text-gray-600">{Number(rule.rate_percent).toFixed(2)}%</td>
                          <td className="px-6 py-4 text-gray-600">
                            {new Date(rule.effective_date).toLocaleDateString("en-TZ")}
                          </td>
                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>
              </div>
            )}

          </div>

        )}

      </div>

    </div>
  );
}
