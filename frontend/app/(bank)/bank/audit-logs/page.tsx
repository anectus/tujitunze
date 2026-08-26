"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useLanguage } from "@/lib/context/LanguageContext";
import { bankAuditLogsTranslations } from "@/constants/translations/bank-audit-logs";

interface ActivityLog {
  audit_id: number;
  action_type: string;
  affected_table: string | null;
  ip_address: string | null;
  created_at: string;
}

interface ApiAccessLog {
  log_id: number;
  event_type: string;
  endpoint: string | null;
  response_status: number | null;
  success: boolean;
  message: string | null;
  created_at: string;
}

export default function BankAuditLogsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = bankAuditLogsTranslations[language];

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiAccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    Promise.all([
      fetch("http://localhost:3002/bank/activity-logs", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch("http://localhost:3002/bank/api-access-logs", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([activity, api]) => {
        setActivityLogs(activity);
        setApiLogs(api);
      })
      .catch(() => setError(t.unableToLoad))
      .finally(() => setLoading(false));
  }, [router, t.unableToLoad]);

  return (
    <div>

      <DashboardHeader title={t.title} />

      <div className="p-4 sm:p-8">

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="text-gray-500">{t.loading}</p>

        ) : (

          <div className="space-y-6">

            {/* Transaction Audit Logs + User Activity + Approval Logs (all audit_logs) */}
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">
                {t.activitySectionTitle}
              </p>

              {activityLogs.length === 0 ? (

                <p className="text-sm text-gray-500">{t.noActivity}</p>

              ) : (

                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

                  <table className="w-full text-left text-sm">

                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-6 py-3 font-semibold">{t.action}</th>
                        <th className="px-6 py-3 font-semibold">{t.table}</th>
                        <th className="px-6 py-3 font-semibold">{t.ipAddress}</th>
                        <th className="px-6 py-3 font-semibold">{t.date}</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">

                      {activityLogs.map((log) => (
                        <tr key={log.audit_id}>
                          <td className="px-6 py-4 font-medium text-gray-900">{log.action_type}</td>
                          <td className="px-6 py-4 text-gray-600">{log.affected_table ?? "—"}</td>
                          <td className="px-6 py-4 text-gray-600">{log.ip_address ?? "—"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {new Date(log.created_at).toLocaleString("en-TZ")}
                          </td>
                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>

              )}
            </div>

            {/* API Logs */}
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">{t.apiLogsTitle}</p>

              {apiLogs.length === 0 ? (

                <p className="text-sm text-gray-500">{t.noApiActivity}</p>

              ) : (

                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

                  <table className="w-full text-left text-sm">

                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-6 py-3 font-semibold">{t.event}</th>
                        <th className="px-6 py-3 font-semibold">{t.endpoint}</th>
                        <th className="px-6 py-3 font-semibold">{t.result}</th>
                        <th className="px-6 py-3 font-semibold">{t.date}</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">

                      {apiLogs.map((log) => (
                        <tr key={log.log_id}>
                          <td className="px-6 py-4 font-medium text-gray-900">{log.event_type}</td>
                          <td className="px-6 py-4 text-gray-600">{log.endpoint ?? "—"}</td>
                          <td className={`px-6 py-4 ${log.success ? "text-green-700" : "text-red-700"}`}>
                            {log.success ? t.success : t.failed}
                            {log.response_status ? ` (${log.response_status})` : ""}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {new Date(log.created_at).toLocaleString("en-TZ")}
                          </td>
                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>

              )}
            </div>

            {/* Security Events — honest gap */}
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-gray-600">{t.securityEventsTitle}</p>
              <p className="mt-2 text-sm text-gray-400">
                {t.securityEventsNote}
              </p>
            </div>

          </div>

        )}

      </div>

    </div>
  );
}
