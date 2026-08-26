"use client";

import ComingSoonPage from "@/components/common/ComingSoonPage";
import { useLanguage } from "@/lib/context/LanguageContext";
import { comingSoonTranslations } from "@/constants/translations/coming-soon";

export default function QrCodePage() {
  const { language } = useLanguage();
  const t = comingSoonTranslations[language].qr;

  return <ComingSoonPage title={t.title} description={t.description} />;
}
