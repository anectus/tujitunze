"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import { useLanguage } from "@/lib/context/LanguageContext";
import { heroTranslations } from "@/constants/translations/home";
import { useAuth } from "@/lib/hooks/useAuth";

// Lazy-loaded: the illustration is pure decoration (aria-hidden), so it
// doesn't need to be in the initial JS payload or block first paint of
// the actual headline/CTA content above it.
const HeroIllustration = dynamic(
  () => import("@/components/home/HeroIllustration"),
  {
    loading: () => (
      <div
        aria-hidden="true"
        className="aspect-[480/420] w-full animate-pulse rounded-3xl bg-emerald-100/60"
      />
    ),
  }
);

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2";

export default function Hero() {
  const { language } = useLanguage();
  const t = heroTranslations[language];
  const { isAuthenticated } = useAuth();

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  // Subtle parallax: the illustration rises slightly slower than the
  // page scrolls past the hero, rather than moving 1:1 with it.
  const illustrationY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  return (
    <section
      ref={sectionRef}
      className="relative pt-32 pb-20 bg-gradient-to-br from-emerald-50 to-white px-12 max-md:px-4"
    >

      <div className="max-w-7xl mx-auto px-6 max-md:px-4">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-md:gap-8 items-center">


          {/* Left Side - Main Content */}
          <div className="max-md:text-center">

            {/* Was "Health Savings & Insurance Management System" —
                replaced with the more emotionally direct line. */}
            <span className="inline-block bg-emerald-200 text-emerald-800 px-4 py-2 rounded-full text-sm md:text-base font-medium shadow-md transition-all duration-300 ease-in-out hover:shadow-lg mb-5">
              {t.subheadline}
            </span>


            <h1 className="text-[36px] md:text-[56px] font-bold leading-tight bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent">
              {t.titleLine1}
              {t.titleHighlight}
            </h1>


            <p className="mt-6 max-w-[640px] text-lg text-gray-700 leading-relaxed max-md:mx-auto">
              {t.description}
            </p>


            {/* Two CTAs: a bold primary action for prospective members,
                and a secondary one for partner inquiries — routed to
                /contact since there's no dedicated partner-intake page
                built yet. */}
            {!isAuthenticated && (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
                {/* Two separate destinations sharing one button look:
                    the circle goes to /login, the label goes to
                    /register — a plain group div rather than a single
                    Link, so each half is its own click target. */}
                <div
                  className="
                  group
                  bg-emerald-600
                  text-white
                  font-semibold
                  inline-flex
                  items-center
                  gap-3
                  pl-2
                  pr-2
                  py-2
                  rounded-full
                  shadow-lg
                  hover:-translate-y-0.5
                  hover:bg-emerald-700
                  hover:animate-pulse
                  transition-all
                  duration-200
                  ease-in-out"
                >
                  <Link
                    href="/login"
                    aria-label={t.login}
                    className={`
                    flex h-9 w-9 shrink-0
                    items-center justify-center
                    rounded-full
                    bg-white
                    text-emerald-700
                    transition-transform
                    duration-300
                    ease-in-out
                    hover:scale-110
                    hover:rotate-45
                    ${FOCUS_RING}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      aria-hidden="true"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12h15m0 0-6-6m6 6-6 6"
                      />
                    </svg>
                  </Link>

                  <Link
                    href="/register"
                    className={`rounded-full py-1 pr-4 hover:underline ${FOCUS_RING}`}
                  >
                    {t.becomeMember}
                  </Link>
                </div>

                <Link
                  href="/contact"
                  className={`
                  border-2
                  border-emerald-600
                  text-emerald-700
                  font-semibold
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  px-6
                  py-3
                  rounded-full
                  hover:-translate-y-0.5
                  hover:bg-emerald-50
                  hover:animate-pulse
                  transition-all
                  duration-200
                  ease-in-out
                  ${FOCUS_RING}`}
                >
                  {t.partnerWithUs}
                </Link>
              </div>
            )}


          </div>



          {/* Right Side - Illustration — lazy-loaded, with a subtle
              scroll-linked parallax rise. */}
          <motion.div
            style={{ y: illustrationY }}
            className="relative max-md:order-first md:ml-[10%] drop-shadow-xl"
          >
            <HeroIllustration />
          </motion.div>


        </div>

      </div>

    </section>
  );
}
