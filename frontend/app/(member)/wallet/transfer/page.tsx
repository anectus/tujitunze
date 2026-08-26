"use client";

import ComingSoonPage from "@/components/common/ComingSoonPage";
import { useLanguage } from "@/lib/context/LanguageContext";
import { comingSoonTranslations } from "@/constants/translations/coming-soon";

export default function WalletTransferPage() {
  const { language } = useLanguage();
  const t = comingSoonTranslations[language].walletTransfer;

  return (
    <ComingSoonPage
      title={t.title}
      description={t.description}
      backHref="/wallet"
      backLabel={t.backLabel}
    />
  );
}
