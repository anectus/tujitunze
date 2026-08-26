"use client";

import Header from "@/components/common/Header";
import Services from "@/components/home/Services";
import FAQSection from "@/components/common/FAQSection";
import Footer from "@/components/common/Footer";
import { useLanguage } from "@/lib/context/LanguageContext";
import {
  servicesFaqSectionTranslations,
  servicesFaqsTranslations,
} from "@/constants/translations/public-services";

export default function ServicesPage() {
  const { language } = useLanguage();
  const t = servicesFaqSectionTranslations[language];

  return (
    <>
      <Header />
      <Services />
      <FAQSection
        title={t.title}
        description={t.description}
        items={servicesFaqsTranslations[language]}
      />
      <Footer />
    </>
  );
}
