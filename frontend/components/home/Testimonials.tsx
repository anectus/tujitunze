"use client";

import { motion } from "framer-motion";

import { useLanguage } from "@/lib/context/LanguageContext";
import { testimonialsTranslations } from "@/constants/translations/home";

// Only one real quote is used here (the example given in the design
// brief itself), attributed generically rather than to an invented
// named person with a fabricated photo — three distinct testimonials
// would mean inventing three fake identities presented as real
// customers, and a carousel implies multiple items to rotate through,
// which there isn't yet. Swap in real member quotes/photos here when
// available, and a carousel becomes worth building once there are 2+.
function PatternOverlay() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
    >
      <defs>
        <pattern id="testimonial-pattern" width="140" height="140" patternUnits="userSpaceOnUse">
          <path
            d="M30 8 L46 14 C46 34 40 48 30 56 C20 48 14 34 14 14 Z"
            fill="none"
            stroke="#065F46"
            strokeWidth="2"
          />
          <circle cx="100" cy="90" r="18" fill="none" stroke="#065F46" strokeWidth="2" />
          <circle cx="100" cy="90" r="11" fill="none" stroke="#065F46" strokeWidth="2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#testimonial-pattern)" />
    </svg>
  );
}

export default function Testimonials() {
  const { language } = useLanguage();
  const t = testimonialsTranslations[language];

  return (
    <section className="relative overflow-hidden bg-[#F0FDF4] py-20 px-6">
      <PatternOverlay />

      <div className="relative max-w-3xl mx-auto text-center">
        <h2 className="text-[28px] font-bold text-emerald-800">
          {t.heading}
        </h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mt-10 max-w-[640px] mx-auto rounded-xl border border-gray-100 bg-white p-6 md:p-8 shadow-md"
        >
          <p className="text-lg italic text-gray-700">
            &ldquo;{t.quotes[0]}&rdquo;
          </p>
          <p className="mt-1 text-sm font-medium text-emerald-700">
            {t.attribution}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
