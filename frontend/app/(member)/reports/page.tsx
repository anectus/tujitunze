"use client";

import ComingSoonPage from "@/components/common/ComingSoonPage";
import { useLanguage } from "@/lib/context/LanguageContext";
import { comingSoonTranslations } from "@/constants/translations/coming-soon";

export default function ReportsPage() {
  const { language } = useLanguage();
  const t = comingSoonTranslations[language].reports;

  return <ComingSoonPage title={t.title} description={t.description} />;
}
