"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import { useLanguage } from "@/lib/context/LanguageContext";
import { walletTransactionsTranslations } from "@/constants/translations/member-wallet";
import { API_URL } from "@/lib/utils/api";
import PageContainer from "@/components/dashboard/PageContainer";

interface Transaction {
  walletTransactionId: number;
  transactionType: string;
  amount: string;
  transactionReference: string | null;
  remarks: string | null;
  transactionDate: string;
}

const PAGE_SIZE = 10;

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ")}`;
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

export default function WalletTransactionsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = walletTransactionsTranslations[language];

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    fetch(
      `${API_URL}/members/wallet/transactions?page=${page}&pageSize=${PAGE_SIZE}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
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
      .then((data) => {
        if (data) {
          setTransactions(data.items);
          setTotal(data.total);
          setTotalAmount(data.totalAmount);
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : t.errorFallback)
      )
      .finally(() => setLoading(false));
  }, [router, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageContainer backHref="/wallet" backLabel={t.backToWallet}>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

          <h1 className="text-3xl font-bold text-gray-900">
            {t.title}
          </h1>

          <p className="text-sm text-gray-600">
            {t.totalContributed} <span className="font-semibold text-gray-900">{formatTsh(totalAmount)}</span>
          </p>

        </div>

        {error && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="mt-8 text-gray-500">{t.loading}</p>

        ) : transactions.length === 0 ? (

          <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
            <p className="text-gray-600">{t.noTransactionsTitle}</p>
            <p className="mt-2 text-sm text-gray-400">
              {t.noTransactionsDescription}
            </p>
          </div>

        ) : (

          <>
            <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">

              <table className="w-full text-left text-sm">

                <thead className="bg-white text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">{t.columnDate}</th>
                    <th className="px-6 py-3 font-semibold">{t.columnDescription}</th>
                    <th className="px-6 py-3 font-semibold">{t.columnReference}</th>
                    <th className="px-6 py-3 font-semibold">{t.columnType}</th>
                    <th className="px-6 py-3 font-semibold">{t.columnAmount}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {transactions.map((transaction) => (

                    <tr key={transaction.walletTransactionId}>

                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(transaction.transactionDate)}
                      </td>

                      <td className="px-6 py-4 text-gray-900">
                        {transaction.remarks || "—"}
                      </td>

                      <td className="px-6 py-4 text-gray-500">
                        {transaction.transactionReference || "—"}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {transaction.transactionType}
                      </td>

                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatTsh(Number(transaction.amount))}
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
                  font-semibold text-gray-700 transition hover:bg-gray-50
                  disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.previous}
                </button>

                <span className="text-gray-500">
                  {t.pageOfTemplate
                    .replace("{page}", String(page))
                    .replace("{totalPages}", String(totalPages))}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-gray-300 px-4 py-2
                  font-semibold text-gray-700 transition hover:bg-gray-50
                  disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.next}
                </button>

              </div>

            )}
          </>

        )}

    </PageContainer>
  );
}
