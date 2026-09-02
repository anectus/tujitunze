"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import { useLanguage } from "@/lib/context/LanguageContext";
import { walletDepositTranslations } from "@/constants/translations/member-wallet";
import { API_URL } from "@/lib/utils/api";

interface PhoneNumber {
  phoneId: number;
  phoneNumber: string;
  isPrimary: boolean;
}

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ", { minimumFractionDigits: 2 })}`;
}

export default function WalletDepositPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = walletDepositTranslations[language];

  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [phoneId, setPhoneId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/members/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        const profile = await response.json();

        if (!response.ok) {
          throw new Error(profile.message || t.loadErrorFallback);
        }

        const phones: PhoneNumber[] = profile.phoneNumbers || [];
        setPhoneNumbers(phones);

        if (phones.length) {
          const primary = phones.find((phone) => phone.isPrimary);
          setPhoneId(String((primary || phones[0]).phoneId));
        }
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : t.loadErrorFallback
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const parsedAmount = Number(amount);

    if (!phoneId) {
      setError(t.choosePhoneError);
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      setError(t.amountError);
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_URL}/members/wallet/topup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: parsedAmount,
            sourceType: "phone",
            sourceId: Number(phoneId),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.errorFallback);
      }

      setSuccess(t.successTemplate.replace("{amount}", formatTsh(parsedAmount)));
      setAmount("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.errorFallback
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-lg mx-auto">

        <Link
          href="/wallet"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← {t.backToWallet}
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          {t.title}
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          {t.description}
        </p>

        {loadError && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {loading ? (

          <p className="mt-8 text-gray-500">{t.loading}</p>

        ) : (

          <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

            {error && (
              <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-lg bg-blue-100 px-4 py-3 text-sm text-blue-700">
                {success}
              </div>
            )}

            {phoneNumbers.length === 0 ? (

              <p className="text-sm text-gray-500">
                {t.addPhonePrefix}{" "}
                <Link href="/profile" className="font-medium text-blue-700 hover:text-blue-800">
                  {t.profileLink}
                </Link>{" "}
                {t.addPhoneSuffix}
              </p>

            ) : (

              <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {t.from}
                  </label>
                  <select
                    value={phoneId}
                    onChange={(e) => setPhoneId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300
                    px-4 py-3 text-gray-900 outline-none transition
                    focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
                  >
                    {phoneNumbers.map((phone) => (
                      <option key={phone.phoneId} value={phone.phoneId}>
                        {phone.phoneNumber}
                        {phone.isPrimary ? t.primarySuffix : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {t.amountLabel}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t.amountPlaceholder}
                    className="w-full rounded-lg border border-gray-300
                    px-4 py-3 text-gray-900 outline-none transition
                    focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-blue-700 py-3
                  font-semibold text-white transition hover:bg-blue-800
                  disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? t.sending : t.confirmDeposit}
                </button>

              </form>

            )}

          </div>

        )}

      </div>

    </div>
  );
}
