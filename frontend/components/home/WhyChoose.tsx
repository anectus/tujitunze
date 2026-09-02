"use client";

import { useLanguage } from "@/lib/context/LanguageContext";
import { heroTranslations } from "@/constants/translations/home";

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h15a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-15A2.25 2.25 0 0 1 0 17.99V6a2.25 2.25 0 0 1 2.25-2.25h13.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75h3.75v3.75H16.5a1.875 1.875 0 0 1 0-3.75Z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <rect x="7" y="2.25" width="10" height="19.5" rx="2.25" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 18.5h2" />
    </svg>
  );
}

function BankIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M4 21V10.5M20 21V10.5M2.25 10.5 12 3l9.75 7.5M7 21v-6M12 21v-6M17 21v-6" />
    </svg>
  );
}

const CARD_STYLES = [
  { icon: WalletIcon, badge: "bg-green-100 text-green-700" },
  { icon: PhoneIcon, badge: "bg-blue-100 text-blue-700" },
  { icon: BankIcon, badge: "bg-green-100 text-green-700" },
] as const;

export default function WhyChoose() {
  const { language } = useLanguage();
  const t = heroTranslations[language];

  const cards = [
    { title: t.feature1Title, description: t.feature1Description },
    { title: t.feature2Title, description: t.feature2Description },
    { title: t.feature3Title, description: t.feature3Description },
  ];

  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-10">
          {t.whyChoose}
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, index) => {
            const style = CARD_STYLES[index];
            const Icon = style.icon;

            return (
              <div
                key={card.title}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md transition hover:shadow-xl hover:-translate-y-1"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${style.badge}`}>
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mt-4 text-lg font-bold text-gray-900">
                  {card.title}
                </h3>

                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
