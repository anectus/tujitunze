
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import { useLanguage } from "@/lib/context/LanguageContext";
import { walletPageTranslations } from "@/constants/translations/member-wallet";
import { commonTranslations } from "@/constants/translations/common";
import { API_URL } from "@/lib/utils/api";

interface PhoneNumber {
  phoneId: number;
  phoneNumber: string;
  isPrimary: boolean;
}

interface Wallet {
  walletId: number;
  walletNumber: string;
  balance: number;
  walletStatus: string;
}

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ", { minimumFractionDigits: 2 })}`;
}

export default function WalletPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = walletPageTranslations[language];
  const common = commonTranslations[language];

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showTopUp, setShowTopUp] = useState(false);
  const [phoneId, setPhoneId] = useState("");
  const [amount, setAmount] = useState("");
  const [topUpError, setTopUpError] = useState("");
  const [topUpSuccess, setTopUpSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const [walletResponse, profileResponse] = await Promise.all([
          fetch(`${API_URL}/members/wallet`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/members/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (walletResponse.status === 401 || profileResponse.status === 401) {
          router.push("/login");
          return;
        }

        const walletData = await walletResponse.json();
        const profileData = await profileResponse.json();

        if (!walletResponse.ok) {
          throw new Error(walletData.message || t.errorFallback);
        }

        setWallet(walletData);
        setPhoneNumbers(profileData.phoneNumbers || []);

        if (profileData.phoneNumbers?.length) {
          const primary = profileData.phoneNumbers.find(
            (p: PhoneNumber) => p.isPrimary
          );
          setPhoneId(String((primary || profileData.phoneNumbers[0]).phoneId));
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t.errorFallback
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const handleTopUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTopUpError("");
    setTopUpSuccess("");

    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const parsedAmount = Number(amount);

    if (!phoneId) {
      setTopUpError(t.choosePhoneError);
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      setTopUpError(t.amountError);
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
        throw new Error(data.message || t.topUpErrorFallback);
      }

      setWallet({
        walletId: data.walletId,
        walletNumber: data.walletNumber,
        balance: data.balance,
        walletStatus: data.walletStatus,
      });
      setTopUpSuccess(
        t.topUpSuccessTemplate.replace("{amount}", formatTsh(parsedAmount))
      );
      setAmount("");
      setShowTopUp(false);
    } catch (err) {
      setTopUpError(
        err instanceof Error ? err.message : t.topUpErrorFallback
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-lg mx-auto">

        <Link
          href="/dashboard"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← {common.backToDashboard}
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          {t.title}
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          {t.descriptionBefore}{" "}
          <span className="italic">mtu wa kawaida</span>
          {t.descriptionAfter}
        </p>

        {error && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="mt-8 text-gray-500">{t.loadingWallet}</p>

        ) : wallet ? (

          <>
            {/* One screen to check balance */}
            <div className="mt-8 rounded-2xl bg-blue-700 p-8 text-center text-white shadow-lg">

              <p className="text-sm font-medium text-blue-100">
                {t.availableBalance}
              </p>

              <p className="mt-2 text-4xl font-bold">
                {formatTsh(wallet.balance)}
              </p>

              <p className="mt-3 text-xs text-blue-100">
                {t.wallet} {wallet.walletNumber}
              </p>

            </div>

            {topUpSuccess && !showTopUp && (
              <div className="mt-6 rounded-lg bg-blue-100 px-4 py-3 text-sm text-blue-700">
                {topUpSuccess}
              </div>
            )}

            {/* One button to top up */}
            {!showTopUp && (
              <button
                type="button"
                onClick={() => {
                  setShowTopUp(true);
                  setTopUpSuccess("");
                }}
                disabled={phoneNumbers.length === 0}
                className="mt-6 w-full rounded-lg bg-blue-700 py-4
                text-lg font-semibold text-white transition
                hover:bg-blue-800 disabled:cursor-not-allowed
                disabled:opacity-60"
              >
                {t.topUp}
              </button>
            )}

            {phoneNumbers.length === 0 && !showTopUp && (
              <p className="mt-2 text-center text-xs text-gray-500">
                {t.addPhoneToTopUp}
              </p>
            )}

            {showTopUp && (
              <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

                {topUpError && (
                  <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
                    {topUpError}
                  </div>
                )}

                <form onSubmit={handleTopUp} className="space-y-4">

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
                      autoFocus
                      className="w-full rounded-lg border border-gray-300
                      px-4 py-3 text-gray-900 outline-none transition
                      focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="flex gap-3">

                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 rounded-lg bg-blue-700 py-3
                      font-semibold text-white transition hover:bg-blue-800
                      disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? t.sending : t.confirmTopUp}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowTopUp(false);
                        setTopUpError("");
                      }}
                      className="rounded-lg border border-gray-300 px-4
                      py-3 font-semibold text-gray-700 transition
                      hover:bg-gray-50"
                    >
                      {common.cancel}
                    </button>

                  </div>

                </form>

              </div>
            )}

            <Link
              href="/wallet/transactions"
              className="mt-6 block text-center text-sm font-medium
              text-blue-700 hover:text-blue-800"
            >
              {t.viewTransactionHistory}
            </Link>
          </>

        ) : null}

      </div>

    </div>
  );
}
