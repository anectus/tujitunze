"use client";

import Header from "@/components/common/Header";
import Hero from "@/components/home/Hero";
import Services from "@/components/home/Services";
import FAQSection from "@/components/common/FAQSection";
import Footer from "@/components/common/Footer";
import { useLanguage } from "@/lib/context/LanguageContext";
import {
  faqSectionTranslations,
  homeFaqsTranslations,
} from "@/constants/translations/home";


export default function Home(){
  const { language } = useLanguage();
  const t = faqSectionTranslations[language];

  return(
    <>
      <Header />

      <Hero />

      <Services />

      <FAQSection
        title={t.title}
        description={t.description}
        items={homeFaqsTranslations[language]}
      />

      <Footer />
    </>
  );

}
