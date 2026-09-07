
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import { useLanguage } from "@/lib/context/LanguageContext";
import { walletPageTranslations } from "@/constants/translations/member-wallet";
import { commonTranslations } from "@/constants/translations/common";
import { API_URL } from "@/lib/utils/api";

interface Wallet {
  walletId: number;
  walletNumber: string;
  balance: number;
  walletStatus: string;
}

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ", { minimumFractionDigits: 2 })}`;
}

// Read-only balance view — the Health Wallet model only grows through
// deductions from a member's linked telecom/bank accounts (Telecom's
// resource-conversion/outgoing-diversion webhooks, Bank's contribution
// flow), never a member-initiated push. There is deliberately no top-up
// or withdraw action here.
export default function WalletPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = walletPageTranslations[language];
  const common = commonTranslations[language];

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/members/wallet`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || t.errorFallback);
        }

        setWallet(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.errorFallback);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router, t.errorFallback]);

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

            <p className="mt-4 text-center text-xs text-gray-500">
              {t.fundingNote}
            </p>

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
