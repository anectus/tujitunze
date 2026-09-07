"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { useLanguage } from "@/lib/context/LanguageContext";
import { trustTranslations } from "@/constants/translations/home";

// Real logos for Vodacom/Halotel (public/logos/*.jpeg — legitimate,
// already-present project assets; verified by opening each file before
// wiring it in here). No NMB Bank logo file exists anywhere in the
// repo, so it stays a generic bank glyph + text rather than a fetched/
// recreated third-party mark — that would misrepresent an endorsement
// that hasn't been granted, the same reasoning that already applied
// when none of the three had a logo. Presenting a regulator (TIRA)
// alongside these as a "partner" would also misrepresent what TIRA's
// relationship to this platform actually is, so the regulatory tagline
// stays text-only, matching Footer.tsx.
const NETWORKS = [
  { name: "Vodacom", logo: "/logos/vodacom.jpeg" },
  { name: "Halotel", logo: "/logos/halotel.jpeg" },
  { name: "NMB Bank", logo: null },
] as const;

function BankGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M4 21V10.5M20 21V10.5M2.25 10.5 12 3l9.75 7.5M7 21v-6M12 21v-6M17 21v-6" />
    </svg>
  );
}

const BADGE_VARIANTS = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function Trust() {
  const { language } = useLanguage();
  const t = trustTranslations[language];

  return (
    <section className="bg-brand-mint/10 py-16 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-[28px] font-bold text-emerald-800">
          {t.heading}
        </h2>

        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {t.networksLabel}
        </p>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          transition={{ staggerChildren: 0.1 }}
          className="mt-4 flex flex-wrap justify-center gap-4"
        >
          {NETWORKS.map((network) => (
            <motion.span
              key={network.name}
              variants={BADGE_VARIANTS}
              className="group inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-5 py-2 text-sm font-semibold text-brand-emerald shadow-sm transition-all duration-200 hover:bg-emerald-100 hover:shadow-md"
            >
              {network.logo ? (
                <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full transition-transform duration-200 group-hover:scale-110">
                  <Image
                    src={network.logo}
                    alt={`${network.name} logo`}
                    fill
                    className="object-cover"
                    sizes="20px"
                  />
                </span>
              ) : (
                <BankGlyph className="h-4 w-4 shrink-0" />
              )}
              {network.name}
            </motion.span>
          ))}
        </motion.div>

        <p className="mt-8 text-sm italic text-gray-500">
          {t.tagline}
        </p>
      </div>
    </section>
  );
}
