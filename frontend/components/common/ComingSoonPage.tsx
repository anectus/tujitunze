"use client";

import { useLanguage } from "@/lib/context/LanguageContext";
import { commonTranslations } from "@/constants/translations/common";
import PageContainer from "@/components/dashboard/PageContainer";

interface ComingSoonPageProps {
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
}

// Shared placeholder for member route-group folders that exist (see the
// route-group table in CLAUDE.md) but have no backend behind them yet —
// same honestly-labeled, not-pretending-to-be-live pattern already used by
// wallet/transactions and insurance/claims, just factored out since this
// page now covers a dozen folders instead of two.
export default function ComingSoonPage({
  title,
  description,
  backHref = "/dashboard",
  backLabel,
}: ComingSoonPageProps) {
  const { language } = useLanguage();
  const t = commonTranslations[language];

  return (
    <PageContainer backHref={backHref} backLabel={backLabel}>

      <h1 className="mt-4 text-3xl font-bold text-gray-900">
        {title}
      </h1>

      <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 md:p-10 text-center">

        <p className="text-gray-600">
          {description}
        </p>

        <p className="mt-3 text-sm font-semibold text-gray-400">
          {t.comingSoon}
        </p>

      </div>

    </PageContainer>
  );
}
