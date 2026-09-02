"use client";

import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { useLanguage } from "@/lib/context/LanguageContext";
import { privacyPolicyTranslations } from "@/constants/translations/public-privacy-policy";

export default function PrivacyPolicyPage() {
  const { language } = useLanguage();
  const t = privacyPolicyTranslations[language];

  return (
    <>
      <Header />

      <section className="bg-white py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900">{t.heading}</h1>

          <p className="mt-2 text-sm text-gray-500">
            {t.lastUpdatedLabel}: {t.lastUpdatedDate}
          </p>

          <p className="mt-6 text-gray-600 text-lg leading-8">{t.intro}</p>

          <div className="mt-12 space-y-10">
            {t.sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {section.title}
                </h2>

                <p className="text-gray-600 leading-7">{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
