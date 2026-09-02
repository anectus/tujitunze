"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { useLanguage } from "@/lib/context/LanguageContext";
import { commonTranslations } from "@/constants/translations/common";
import { telecomContributionsTranslations } from "@/constants/translations/telecom-contributions";
import { API_URL } from "@/lib/utils/api";

interface Contribution {
  contribution_id: number;
  reference_number: string | null;
  contribution_amount: string;
  contribution_source: string;
  processing_status: string;
  contribution_date: string;
}

const PAGE_SIZE = 20;

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ")}`;
}

export default function TelecomContributionsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = telecomContributionsTranslations[language];
  const common = commonTranslations[language];

  const STATUS_FILTERS = [
    { label: t.filterAll, value: "" },
    { label: t.filterSuccessful, value: "Confirmed" },
    { label: t.filterPending, value: "Pending" },
    { label: t.filterFailed, value: "Failed" },
  ];

  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [recordSuccess, setRecordSuccess] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      ...(status ? { status } : {}),
    });

    fetch(`${API_URL}/telecom/contributions?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || t.loadError);
        }

        return data;
      })
      .then((data) => {
        setContributions(data.items);
        setTotal(data.total);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : t.loadError)
      )
      .finally(() => setLoading(false));
  }, [router, page, status, reloadKey]);

  const recordContribution = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    setRecording(true);
    setRecordError("");
    setRecordSuccess("");

    try {
      const response = await fetch(`${API_URL}/telecom/contributions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phoneNumber,
          amount: Number(amount),
          referenceNumber,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.recordError);
      }

      setRecordSuccess(t.recordSuccess);
      setPhoneNumber("");
      setAmount("");
      setReferenceNumber("");
      setPage(1);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : t.recordError);
    } finally {
      setRecording(false);
    }
  };

  const exportCsv = () => {
    const token = getAccessToken();
    if (!token) return;

    const query = status ? `?status=${status}` : "";

    fetch(`${API_URL}/telecom/contributions/export${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "contributions.csv";
        link.click();
        URL.revokeObjectURL(url);
      });
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>

      <DashboardHeader title={t.headerTitle} />

      <div className="p-4 sm:p-8">

        {/* Record a contribution */}
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

          <p className="text-lg font-bold text-gray-900">{t.recordTitle}</p>
          <p className="mt-1 text-sm text-gray-500">{t.recordDescription}</p>

          {recordError && (
            <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
              {recordError}
            </div>
          )}
          {recordSuccess && (
            <div className="mt-4 rounded-lg bg-green-100 px-4 py-3 text-sm text-green-700">
              {recordSuccess}
            </div>
          )}

          <form onSubmit={recordContribution} className="mt-4 grid gap-4 sm:grid-cols-4">

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">{t.phoneNumberLabel}</label>
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={t.phoneNumberPlaceholder}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">{t.amountLabel}</label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">{t.referenceLabel}</label>
              <input
                type="text"
                required
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder={t.referencePlaceholder}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={recording}
                className="w-full rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {recording ? t.recording : t.recordButton}
              </button>
            </div>

          </form>

        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => {
                  setStatus(filter.value);
                  setPage(1);
                }}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  status === filter.value
                    ? "bg-blue-700 text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={exportCsv}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm
            font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            {t.exportCsv}
          </button>

        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="text-gray-500">{common.loading}</p>

        ) : contributions.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
            <p className="text-gray-600">{t.emptyTitle}</p>
            <p className="mt-2 text-sm text-gray-400">
              {t.emptyBody}
            </p>
          </div>

        ) : (

          <>
            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

              <table className="w-full text-left text-sm">

                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">{t.transactionId}</th>
                    <th className="px-6 py-3 font-semibold">{t.reference}</th>
                    <th className="px-6 py-3 font-semibold">{t.amount}</th>
                    <th className="px-6 py-3 font-semibold">{t.source}</th>
                    <th className="px-6 py-3 font-semibold">{common.status}</th>
                    <th className="px-6 py-3 font-semibold">{t.dateTime}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {contributions.map((c) => (

                    <tr key={c.contribution_id}>
                      <td className="px-6 py-4 text-gray-600">{c.contribution_id}</td>
                      <td className="px-6 py-4 text-gray-900">{c.reference_number ?? "—"}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatTsh(Number(c.contribution_amount))}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{c.contribution_source}</td>
                      <td className="px-6 py-4 text-gray-600">
                        <StatusBadge domain="transaction" status={c.processing_status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(c.contribution_date).toLocaleString("en-TZ")}
                      </td>
                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm">

                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-gray-300 px-4 py-2
                  font-semibold text-gray-700 transition hover:bg-white
                  disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.previous}
                </button>

                <span className="text-gray-500">{t.pageOf(page, totalPages)}</span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-gray-300 px-4 py-2
                  font-semibold text-gray-700 transition hover:bg-white
                  disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.next}
                </button>

              </div>
            )}
          </>

        )}

      </div>

    </div>
  );
}
