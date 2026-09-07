"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

import { useLanguage } from "@/lib/context/LanguageContext";
import { publicAboutTranslations } from "@/constants/translations/public-about";

// Lazy-loaded: purely decorative (aria-hidden), no reason to block the
// initial paint of the actual heading/copy for it.
const AboutIllustration = dynamic(
  () => import("@/components/home/AboutIllustration"),
  {
    loading: () => (
      <div
        aria-hidden="true"
        className="aspect-[480/420] w-full animate-pulse rounded-3xl bg-emerald-100/60"
      />
    ),
  }
);

function CheckBadge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#ECFDF5" stroke="#10B981" strokeWidth="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m8 12.5 2.5 2.5L16 9.5" stroke="#059669" />
    </svg>
  );
}

function ShieldGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 L19.5 6 C19.5 12.5 16.3 17.7 12 20.5 C7.7 17.7 4.5 12.5 4.5 6 Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
    </svg>
  );
}

function HandshakeGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5 8 7l3.5 3-2 2 2 2 3-3 3 2M3 11.5l4 4M21 11.5l-4 4" />
    </svg>
  );
}

const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

function FadeIn({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={FADE_UP}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Reused from WhyChoose.tsx's card treatment: a gradient-bordered card
// (a 2px gradient-filled wrapper around a white inset, since CSS borders
// can't take a gradient directly) with lift+shadow on hover.
function GradientCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-200 p-[2px] shadow-md transition-shadow duration-300 hover:shadow-xl"
    >
      <div className={`h-full rounded-[calc(1rem-2px)] bg-white ${className}`}>
        {children}
      </div>
    </motion.div>
  );
}

export default function About() {
  const { language } = useLanguage();
  const t = publicAboutTranslations[language];
  const prefersReducedMotion = useReducedMotion();

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const illustrationY = useTransform(scrollYProgress, [0, 1], [0, -30]);

  return (
    <section className="bg-gradient-to-br from-emerald-50 to-white pt-36 pb-20 px-12 max-md:px-4">
      <div className="max-w-7xl mx-auto px-6 max-md:px-0">

        {/* Hero */}
        <div ref={heroRef} className="relative grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={FADE_UP}
            className="text-center md:text-left"
          >
            <h1 className="text-[28px] md:text-[40px] font-bold text-emerald-800 leading-tight">
              {t.heroTitle}
            </h1>

            <p className="mt-6 text-base font-medium text-gray-600 leading-[1.7] max-w-xl mx-auto md:mx-0">
              {t.heroDescription}
            </p>
          </motion.div>

          <motion.div style={{ y: illustrationY }} className="drop-shadow-xl">
            <AboutIllustration />
          </motion.div>
        </div>

        {/* What is Tujitunze */}
        <FadeIn className="mt-20">
          <GradientCard className="p-6 md:p-10">
            <h2 className="text-[22px] font-semibold text-gray-800">
              {t.whatIsTitle}
            </h2>

            <p className="mt-6 text-base font-medium text-gray-600 leading-[1.7]">
              {t.whatIsBody}
            </p>
          </GradientCard>
        </FadeIn>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <FadeIn>
            <GradientCard className="p-6 md:p-8">
              <h2 className="text-[22px] font-semibold text-gray-800">
                {t.missionTitle}
              </h2>

              <p className="mt-5 text-base font-medium text-gray-600 leading-[1.7]">
                {t.missionBody}
              </p>
            </GradientCard>
          </FadeIn>

          <FadeIn>
            <GradientCard className="p-6 md:p-8">
              <h2 className="text-[22px] font-semibold text-gray-800">
                {t.visionTitle}
              </h2>

              <p className="mt-5 text-base font-medium text-gray-600 leading-[1.7]">
                {t.visionBody}
              </p>
            </GradientCard>
          </FadeIn>
        </div>

        {/* Objectives */}
        <FadeIn className="mt-16">
          <div className="rounded-2xl bg-white p-6 md:p-10 shadow-md">
            <h2 className="text-[22px] font-semibold text-gray-800">
              {t.objectivesTitle}
            </h2>

            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 mt-8">
              {[
                t.objective1,
                t.objective2,
                t.objective3,
                t.objective4,
                t.objective5,
                t.objective6,
                t.objective7,
                t.objective8,
              ].map((objective) => (
                <div
                  key={objective}
                  className="flex items-start gap-3 rounded-lg p-2 transition-shadow duration-300 hover:shadow-[0_0_0_4px_rgba(16,185,129,0.08)]"
                >
                  <CheckBadge className="h-5 w-5 shrink-0 mt-0.5" />
                  <span className="text-base font-medium text-gray-600 leading-[1.7]">
                    {objective}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Core Values — only Security and Trust have real copy; not
            inventing Transparency/Innovation card text that doesn't
            exist yet in publicAboutTranslations. */}
        <div className="mt-16">
          <h2 className="text-[28px] md:text-[40px] font-bold text-center text-emerald-800">
            {t.coreValuesTitle}
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mt-10 max-w-3xl mx-auto">
            <FadeIn>
              <GradientCard className="p-6 md:p-8 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <ShieldGlyph className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-[22px] font-semibold text-gray-800">
                  {t.securityTitle}
                </h3>
                <p className="mt-3 text-base font-medium text-gray-600 leading-[1.7]">
                  {t.securityBody}
                </p>
              </GradientCard>
            </FadeIn>

            <FadeIn>
              <GradientCard className="p-6 md:p-8 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <HandshakeGlyph className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-[22px] font-semibold text-gray-800">
                  {t.trustTitle}
                </h3>
                <p className="mt-3 text-base font-medium text-gray-600 leading-[1.7]">
                  {t.trustBody}
                </p>
              </GradientCard>
            </FadeIn>
          </div>
        </div>

        {/* Closing */}
        <FadeIn className="mt-20">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-700 to-blue-600 p-8 md:p-12 text-center text-white shadow-xl">
            <motion.h2
              animate={
                prefersReducedMotion
                  ? undefined
                  : { opacity: [1, 0.85, 1] }
              }
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-[28px] md:text-[40px] font-bold"
            >
              {t.closingTitle}
            </motion.h2>

            <p className="mt-6 text-lg leading-[1.7] max-w-3xl mx-auto">
              {t.closingBody}
            </p>
          </div>
        </FadeIn>

      </div>
    </section>
  );
}
