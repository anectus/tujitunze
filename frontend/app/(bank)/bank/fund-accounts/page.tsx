"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useLanguage } from "@/lib/context/LanguageContext";
import { bankFundAccountsTranslations } from "@/constants/translations/bank-fund-accounts";
import { API_URL } from "@/lib/utils/api";

interface FundAccount {
  fund_account_id: number;
  account_type: "Settlement" | "Health Fund" | "Reserve";
  account_number: string | null;
  balance: string;
  reserved_balance: string;
  status: string;
}

interface Transfer {
  transfer_id: number;
  transfer_type: string;
  amount: string;
  balance_after: string;
  reference: string | null;
  description: string | null;
  created_at: string;
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 " +
  "text-gray-900 outline-none transition " +
  "focus:border-blue-700 focus:ring-2 focus:ring-blue-200";

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ", { minimumFractionDigits: 2 })}`;
}

function useAuthHeaders() {
  const router = useRouter();

  return () => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return null;
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };
}

export default function FundAccountsPage() {
  const getAuthHeaders = useAuthHeaders();
  const { language } = useLanguage();
  const t = bankFundAccountsTranslations[language];

  const ACCOUNT_LABELS: Record<string, string> = {
    Settlement: t.settlementAccount,
    "Health Fund": t.healthFundAccount,
    Reserve: t.reserveAccount,
  };

  const [accounts, setAccounts] = useState<FundAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [transfersLoading, setTransfersLoading] = useState(false);

  const [transferType, setTransferType] = useState<"Deposit" | "Withdrawal">("Deposit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const load = async () => {
      const headers = getAuthHeaders();
      if (!headers) return;

      try {
        const response = await fetch(`${API_URL}/bank/fund-accounts`, { headers });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || t.unableToLoadAccounts);
        }

        setAccounts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.unableToLoadAccounts);
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTransfers = async (accountType: string) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    setTransfersLoading(true);
    setSelectedType(accountType);

    try {
      const response = await fetch(
        `${API_URL}/bank/fund-accounts/${encodeURIComponent(accountType)}/transfers`,
        { headers }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.unableToLoadHistory);
      }

      setTransfers(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.unableToLoadHistory);
    } finally {
      setTransfersLoading(false);
    }
  };

  const submitTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedType) return;

    const headers = getAuthHeaders();
    if (!headers) return;

    const parsedAmount = Number(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      setFormError(t.amountGreaterThanZero);
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const response = await fetch(
        `${API_URL}/bank/fund-accounts/${encodeURIComponent(selectedType)}/transfer`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ transferType, amount: parsedAmount, description }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.unableToRecordTransfer);
      }

      setAmount("");
      setDescription("");

      // Use the response's own account/transfer objects rather than
      // refetching both endpoints — the server already computed exactly
      // the new state.
      setAccounts((current) =>
        current.map((account) =>
          account.account_type === selectedType ? data.account : account
        )
      );
      setTransfers((current) => [data.transfer, ...current]);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t.unableToRecordTransfer);
    } finally {
      setSubmitting(false);
    }
  };

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

          <div className="grid gap-4 sm:grid-cols-3">

            {accounts.map((account) => {
              const available = Number(account.balance) - Number(account.reserved_balance);

              return (
                <button
                  key={account.fund_account_id}
                  type="button"
                  onClick={() => loadTransfers(account.account_type)}
                  className={`rounded-2xl border p-6 text-left shadow-md transition hover:-translate-y-0.5 hover:shadow-xl ${
                    selectedType === account.account_type
                      ? "border-blue-700 bg-blue-50"
                      : "border-gray-100 bg-white"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-500">
                    {ACCOUNT_LABELS[account.account_type]}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {formatTsh(Number(account.balance))}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {t.available} {formatTsh(available)}
                    {Number(account.reserved_balance) > 0 &&
                      ` · ${t.reserved} ${formatTsh(Number(account.reserved_balance))}`}
                  </p>
                </button>
              );
            })}

          </div>

        )}

        {selectedType && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">

            {/* Fund Transfers */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <p className="text-lg font-bold text-gray-900">
                {t.transferTitle} — {ACCOUNT_LABELS[selectedType]}
              </p>

              {formError && (
                <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <form onSubmit={submitTransfer} className="mt-4 space-y-4">

                <div className="flex gap-2">
                  {(["Deposit", "Withdrawal"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTransferType(type)}
                      className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                        transferType === type
                          ? "bg-blue-700 text-white"
                          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {type === "Deposit" ? t.deposit : t.withdrawal}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">{t.amountLabel}</label>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">{t.descriptionLabel}</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.descriptionPlaceholder}
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-blue-700 py-3 font-semibold text-white
                  transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? t.submitting : `${t.recordPrefix} ${transferType === "Deposit" ? t.deposit : t.withdrawal}`}
                </button>

              </form>

            </div>

            {/* Funding History */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <p className="text-lg font-bold text-gray-900">{t.fundingHistoryTitle}</p>

              {transfersLoading ? (

                <p className="mt-4 text-sm text-gray-500">{t.loading}</p>

              ) : transfers.length === 0 ? (

                <p className="mt-4 text-sm text-gray-500">{t.noTransfers}</p>

              ) : (

                <ul className="mt-4 divide-y divide-gray-100">
                  {transfers.map((transfer) => (
                    <li key={transfer.transfer_id} className="py-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{transfer.transfer_type}</span>
                        <span
                          className={
                            transfer.transfer_type === "Deposit" || transfer.transfer_type === "Settlement In"
                              ? "text-green-700"
                              : "text-red-700"
                          }
                        >
                          {formatTsh(Number(transfer.amount))}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {transfer.description || transfer.reference || "—"} ·{" "}
                        {new Date(transfer.created_at).toLocaleString("en-TZ")}
                      </p>
                    </li>
                  ))}
                </ul>

              )}

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
