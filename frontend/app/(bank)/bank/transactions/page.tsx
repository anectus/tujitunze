"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useLanguage } from "@/lib/context/LanguageContext";
import { bankTransactionsTranslations } from "@/constants/translations/bank-transactions";

interface Transaction {
  bank_transaction_id: number;
  transaction_reference: string;
  transaction_type: string;
  amount: string;
  transaction_status: string;
  transaction_date: string;
  account_number: string;
}

const PAGE_SIZE = 20;

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ")}`;
}

export default function BankTransactionsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = bankTransactionsTranslations[language];

  const TYPE_FILTERS = [
    { label: t.allTransactions, value: "" },
    { label: t.deposits, value: "Deposit" },
    { label: t.withdrawals, value: "Withdrawal" },
    { label: t.contributions, value: "Contribution" },
  ];

  const STATUS_FILTERS = [
    { label: t.all, value: "" },
    { label: t.pending, value: "Pending" },
    { label: t.approved, value: "Approved" },
    { label: t.completed, value: "Completed" },
    { label: t.failed, value: "Failed" },
  ];

  const typeLabel = (value: string) => {
    if (value === "Deposit") return t.deposits;
    if (value === "Withdrawal") return t.withdrawals;
    if (value === "Contribution") return t.contributions;
    return value;
  };

  const statusLabel = (value: string) => {
    switch (value) {
      case "Pending":
        return t.pending;
      case "Approved":
        return t.approved;
      case "Completed":
        return t.completed;
      case "Failed":
        return t.failed;
      default:
        return value;
    }
  };

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [accountNumber, setAccountNumber] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [recordSuccess, setRecordSuccess] = useState("");

  const load = () => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    });

    fetch(`http://localhost:3002/bank/transactions?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || t.unableToLoad);
        }

        return data;
      })
      .then((data) => {
        setTransactions(data.items);
        setTotal(data.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t.unableToLoad))
      .finally(() => setLoading(false));
  };

  useEffect(load, [router, page, type, status]);

  const recordContribution = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    setRecording(true);
    setRecordError("");
    setRecordSuccess("");

    try {
      const response = await fetch("http://localhost:3002/bank/contributions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountNumber,
          amount: Number(contributionAmount),
          transactionReference,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.recordError);
      }

      setRecordSuccess(t.recordSuccess);
      setAccountNumber("");
      setContributionAmount("");
      setTransactionReference("");
      setPage(1);
      load();
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : t.recordError);
    } finally {
      setRecording(false);
    }
  };

  const approve = async (transactionId: number, nextStatus: string) => {
    const token = getAccessToken();
    if (!token) return;

    setUpdatingId(transactionId);

    try {
      const response = await fetch(
        `http://localhost:3002/bank/transactions/${transactionId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      if (response.ok) {
        setTransactions((items) =>
          items.map((t) =>
            t.bank_transaction_id === transactionId
              ? { ...t, transaction_status: nextStatus }
              : t
          )
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const exportCsv = () => {
    const token = getAccessToken();
    if (!token) return;

    const query = new URLSearchParams({
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    });

    fetch(`http://localhost:3002/bank/transactions/export?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "transactions.csv";
        link.click();
        URL.revokeObjectURL(url);
      });
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>

      <DashboardHeader title={t.title} />

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
              <label className="mb-2 block text-sm font-semibold text-gray-700">{t.accountNumberLabel}</label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={t.accountNumberPlaceholder}
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
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">{t.referenceLabel}</label>
              <input
                type="text"
                required
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
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
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => { setType(f.value); setPage(1); }}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  type === f.value ? "bg-blue-700 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {f.label}
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

        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => { setStatus(f.value); setPage(1); }}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                status === f.value ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="text-gray-500">{t.loading}</p>

        ) : transactions.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
            <p className="text-gray-600">{t.noTransactionsTitle}</p>
            <p className="mt-2 text-sm text-gray-400">
              {t.noTransactionsNote}
            </p>
          </div>

        ) : (

          <>
            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

              <table className="w-full text-left text-sm">

                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">{t.reference}</th>
                    <th className="px-6 py-3 font-semibold">{t.account}</th>
                    <th className="px-6 py-3 font-semibold">{t.type}</th>
                    <th className="px-6 py-3 font-semibold">{t.amount}</th>
                    <th className="px-6 py-3 font-semibold">{t.status}</th>
                    <th className="px-6 py-3 font-semibold">{t.date}</th>
                    <th className="px-6 py-3 font-semibold"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {transactions.map((tx) => (
                    <tr key={tx.bank_transaction_id}>
                      <td className="px-6 py-4 text-gray-900">{tx.transaction_reference}</td>
                      <td className="px-6 py-4 text-gray-600">{tx.account_number}</td>
                      <td className="px-6 py-4 text-gray-600">{typeLabel(tx.transaction_type)}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatTsh(Number(tx.amount))}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{statusLabel(tx.transaction_status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(tx.transaction_date).toLocaleString("en-TZ")}
                      </td>
                      <td className="px-6 py-4">
                        {tx.transaction_status === "Pending" && tx.transaction_type === "Withdrawal" && (
                          <button
                            type="button"
                            disabled={updatingId === tx.bank_transaction_id}
                            onClick={() => approve(tx.bank_transaction_id, "Approved")}
                            className="text-xs font-semibold text-blue-700 hover:text-blue-800
                            disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {t.approve}
                          </button>
                        )}
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

                <span className="text-gray-500">{t.pagePrefix} {page} {t.ofPrefix} {totalPages}</span>

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
