"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useLanguage } from "@/lib/context/LanguageContext";
import { bankSettlementsTranslations } from "@/constants/translations/bank-settlements";

interface Settlement {
  settlement_id: number;
  counterparty_type: "Telecom" | "Insurance";
  counterparty_name: string;
  amount: string;
  settlement_status: "Pending" | "Completed";
  settlement_date: string;
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 " +
  "text-gray-900 outline-none transition " +
  "focus:border-blue-700 focus:ring-2 focus:ring-blue-200";

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ")}`;
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

export default function SettlementsPage() {
  const getAuthHeaders = useAuthHeaders();
  const { language } = useLanguage();
  const t = bankSettlementsTranslations[language];

  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completingId, setCompletingId] = useState<number | null>(null);

  const [counterpartyType, setCounterpartyType] = useState<"Telecom" | "Insurance">("Telecom");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [amount, setAmount] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const load = async () => {
      const headers = getAuthHeaders();
      if (!headers) return;

      try {
        const response = await fetch("http://localhost:3002/bank/settlements", { headers });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || t.unableToLoad);
        }

        setSettlements(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.unableToLoad);
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createSettlement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    if (!headers) return;

    const parsedAmount = Number(amount);

    if (!counterpartyName.trim()) {
      setFormError(t.enterCounterpartyName);
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      setFormError(t.amountGreaterThanZero);
      return;
    }

    setCreating(true);
    setFormError("");

    try {
      const response = await fetch("http://localhost:3002/bank/settlements", {
        method: "POST",
        headers,
        body: JSON.stringify({
          counterpartyType,
          counterpartyName: counterpartyName.trim(),
          amount: parsedAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.unableToCreate);
      }

      setCounterpartyName("");
      setAmount("");
      setSettlements((current) => [data, ...current]);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t.unableToCreate);
    } finally {
      setCreating(false);
    }
  };

  const complete = async (settlementId: number) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    setCompletingId(settlementId);

    try {
      const response = await fetch(
        `http://localhost:3002/bank/settlements/${settlementId}/complete`,
        { method: "PATCH", headers }
      );

      if (response.ok) {
        setSettlements((current) =>
          current.map((s) =>
            s.settlement_id === settlementId ? { ...s, settlement_status: "Completed" } : s
          )
        );
      }
    } finally {
      setCompletingId(null);
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

        {/* Record a settlement */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

          <p className="text-lg font-bold text-gray-900">{t.recordTitle}</p>
          <p className="mt-1 text-sm text-gray-500">
            {t.recordDescription}
          </p>

          {formError && (
            <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={createSettlement} className="mt-4 grid gap-4 sm:grid-cols-3">

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">{t.counterparty}</label>
              <select
                value={counterpartyType}
                onChange={(e) => setCounterpartyType(e.target.value as "Telecom" | "Insurance")}
                className={inputClass}
              >
                <option value="Telecom">{t.telecom}</option>
                <option value="Insurance">{t.insurance}</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">{t.name}</label>
              <input
                type="text"
                value={counterpartyName}
                onChange={(e) => setCounterpartyName(e.target.value)}
                placeholder={t.namePlaceholder}
                className={inputClass}
              />
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

            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white
                transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? t.recording : t.recordSettlement}
              </button>
            </div>

          </form>

        </div>

        {/* List */}
        <div className="mt-6">

          {loading ? (

            <p className="text-gray-500">{t.loading}</p>

          ) : settlements.length === 0 ? (

            <p className="text-gray-500">{t.noSettlements}</p>

          ) : (

            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

              <table className="w-full text-left text-sm">

                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">{t.counterparty}</th>
                    <th className="px-6 py-3 font-semibold">{t.type}</th>
                    <th className="px-6 py-3 font-semibold">{t.amount}</th>
                    <th className="px-6 py-3 font-semibold">{t.status}</th>
                    <th className="px-6 py-3 font-semibold">{t.date}</th>
                    <th className="px-6 py-3 font-semibold"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {settlements.map((s) => (
                    <tr key={s.settlement_id}>
                      <td className="px-6 py-4 font-medium text-gray-900">{s.counterparty_name}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {s.counterparty_type === "Telecom" ? t.telecom : t.insurance}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatTsh(Number(s.amount))}
                      </td>
                      <td className="px-6 py-4">
                        <span className={s.settlement_status === "Completed" ? "text-green-700" : "text-amber-700"}>
                          {s.settlement_status === "Completed" ? t.completed : t.pending}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(s.settlement_date).toLocaleDateString("en-TZ")}
                      </td>
                      <td className="px-6 py-4">
                        {s.settlement_status === "Pending" && (
                          <button
                            type="button"
                            disabled={completingId === s.settlement_id}
                            onClick={() => complete(s.settlement_id)}
                            className="text-xs font-semibold text-blue-700 hover:text-blue-800
                            disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {completingId === s.settlement_id ? t.completing : t.complete}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}
