"use client";

import { motion } from "framer-motion";

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

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 L19.5 6 C19.5 12.5 16.3 17.7 12 20.5 C7.7 17.7 4.5 12.5 4.5 6 Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
    </svg>
  );
}

const ICONS = [WalletIcon, PhoneIcon, BankIcon, ShieldIcon] as const;

const GRID_VARIANTS = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function WhyChoose() {
  const { language } = useLanguage();
  const t = heroTranslations[language];

  const cards = [
    { title: t.feature1Title, description: t.feature1Description },
    { title: t.feature2Title, description: t.feature2Description },
    { title: t.feature3Title, description: t.feature3Description },
    { title: t.feature4Title, description: t.feature4Description },
  ];

  return (
    <section className="bg-gradient-to-br from-emerald-50 to-white py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-brand-charcoal mb-10">
          {t.whyChoose}
        </h2>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={GRID_VARIANTS}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {cards.map((card, index) => {
            const Icon = ICONS[index];

            return (
              <motion.div
                key={card.title}
                variants={CARD_VARIANTS}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-200 p-[2px] shadow-md transition-shadow duration-300 hover:shadow-xl"
              >
                <div className="h-full rounded-[calc(1rem-2px)] bg-white p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-[0_0_0_6px_rgba(16,185,129,0.1)] transition-transform duration-300 group-hover:rotate-12">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="mt-4 text-xl font-semibold text-gray-900">
                    {card.title}
                  </h3>

                  <p className="mt-2 text-base text-gray-600 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
