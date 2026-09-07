"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Landmark, Signal, Wallet } from "lucide-react";

import { servicesTranslations } from "@/constants/translations/home";
import { useLanguage } from "@/lib/context/LanguageContext";

interface ServiceCardData {
  title: string;
  description: string;
  icon: typeof Wallet;
  link: string;
}

// "BuildingBank" doesn't exist in lucide-react — Landmark is the
// library's actual bank/institution icon.
const serviceMeta = [
  { icon: Wallet, link: "/wallet" },
  { icon: Signal, link: "/contributions" },
  { icon: Landmark, link: "/banks" },
] as const;

/*
 * IMPORTANT:
 * Replace this with the exact image you placed inside /public.
 *
 * Example:
 * const TELECOM_IMAGE = "/images/telecom.jpg";
 */
const TELECOM_IMAGE = "/health-wallet.jpg";

/* =========================================================
   TELECOM CONTRIBUTIONS
========================================================= */

function TelecomContributionsFeature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = sectionRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -60px 0px",
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      data-telecom-section
      className="relative overflow-hidden rounded-[24px] border border-emerald-100 bg-white shadow-[0_18px_50px_-30px_rgba(6,95,70,0.35)]"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-50 blur-3xl" />
      </div>

      <div className="relative grid items-center md:grid-cols-[1fr_0.9fr]">
        {/* =================================================
            TEXT
        ================================================= */}
        <div
          className={`order-1 px-5 py-7 text-center transition-all duration-700 ease-out sm:px-8 sm:py-8 md:px-10 md:py-10 md:text-left lg:px-14 lg:py-12 ${
            visible
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          {/* Label */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />

            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-800">
              TUJITUNZE
            </span>
          </div>

          {/* Heading */}
          <h3 className="max-w-xl text-[28px] font-bold leading-tight text-emerald-800 sm:text-4xl lg:text-[40px] lg:leading-[1.08]">
            {title}
          </h3>

          {/* Accent line */}
          <div className="mx-auto mt-4 h-1 w-14 rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400 md:mx-0" />

          {/* Description */}
          <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-[1.7] text-gray-600 md:mx-0">
            {description}
          </p>

          {/* Flow */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-gray-500 md:justify-start">
            <span className="rounded-full bg-gray-100 px-3 py-1.5">
              People
            </span>

            <span className="text-emerald-600">→</span>

            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-800">
              Telecom
            </span>

            <span className="text-emerald-600">→</span>

            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-800">
              Contribution
            </span>

            <span className="text-emerald-600">→</span>

            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">
              Health Fund
            </span>
          </div>

        </div>

        {/* =================================================
            IMAGE — a real photo, kept as-is; a couple of small
            floating accent badges (coin, shield) add the "animated"
            feel the brief asked for without discarding a real asset
            in favor of an invented illustration.
        ================================================= */}
        <div
          className={`order-2 px-4 pb-5 sm:px-6 sm:pb-6 md:px-5 md:py-5 lg:px-6 lg:py-6 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`relative mx-auto aspect-[4/3] w-full max-w-[520px] overflow-hidden rounded-[20px] bg-gray-100 transition-all duration-1000 ease-out ${
              visible
                ? "translate-x-0 scale-100"
                : "translate-x-8 scale-[0.96]"
            }`}
          >
            <Image
              src={TELECOM_IMAGE}
              alt={title}
              fill
              priority
              className="object-cover transition-transform duration-700 hover:scale-[1.025]"
              sizes="
                (max-width: 767px) 100vw,
                (max-width: 1023px) 50vw,
                520px
              "
            />

            {/* Very subtle image overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-emerald-950/20 via-transparent to-transparent" />

            {/* Image corner accent */}
            <div className="absolute bottom-4 left-4 h-1 w-12 rounded-full bg-white/90" />

            {/* Floating coin badge */}
            <div
              aria-hidden="true"
              className="absolute -top-3 -right-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-lg shadow-lg [animation:float-slow_4s_ease-in-out_infinite] motion-reduce:[animation:none]"
            >
              🪙
            </div>

            {/* Floating shield badge */}
            <div
              aria-hidden="true"
              className="absolute -bottom-3 -left-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-lg text-white shadow-lg [animation:float-slower_4.5s_ease-in-out_infinite] motion-reduce:[animation:none]"
            >
              🛡️
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   SERVICE CARD
========================================================= */

function ServiceCard({
  service,
  index,
  isVisible,
}: {
  service: ServiceCardData;
  index: number;
  isVisible: boolean;
}) {
  const Icon = service.icon;

  return (
    <div
      className={`group min-h-[220px] rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-200 p-[2px] shadow-md transition-all duration-300 hover:shadow-xl ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-5 opacity-0"
      }`}
      style={{
        transitionDelay: `${index * 100}ms`,
      }}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(1rem-2px)] bg-white p-5 text-center transition-transform duration-300 group-hover:-translate-y-1">
        {/* Icon */}
        <div className="mx-auto inline-flex items-center justify-center rounded-full bg-emerald-100 p-3 text-emerald-600 shadow-[0_0_0_6px_rgba(16,185,129,0.1)] transition-transform duration-200 ease-in-out group-hover:scale-105">
          <Icon className="h-6 w-6 md:h-8 md:w-8" aria-hidden="true" />
        </div>

        {/* Content */}
        <h3 className="mt-4 text-xl font-semibold text-gray-900">
          {service.title}
        </h3>

        <p className="mt-2 text-base leading-[1.7] text-gray-600">
          {service.description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   SERVICES PAGE SECTION
========================================================= */

export default function Services() {
  const { language } = useLanguage();
  const t = servicesTranslations[language];

  const [pageVisible, setPageVisible] = useState(false);

  useEffect(() => {
    setPageVisible(true);
  }, []);

  const services = t.cards.map((card, index) => ({
    ...card,
    ...serviceMeta[index],
  }));

  return (
    <section className="bg-gradient-to-br from-emerald-50 to-white px-3 py-7 sm:px-4 sm:py-8 md:px-6 md:py-9 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}
        <div
          className={`mx-auto max-w-3xl text-center transition-all duration-700 ${
            pageVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-5 opacity-0"
          }`}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />

            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800">
              Services
            </span>
          </div>

          <h2 className="mt-3 text-[28px] font-bold leading-tight text-emerald-800 sm:text-3xl lg:text-[40px]">
            {t.heading}
          </h2>

          <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400" />

          <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-[1.7] text-gray-600">
            {t.description}
          </p>
        </div>

        {/* =================================================
            SERVICES — Wallet + Bank only take up 2 of a 3-column
            grid's slots, which used to leave a lopsided empty third
            column on desktop; a centered flex row fixes that instead
            of forcing a 3rd placeholder card into the grid.
        ================================================= */}
        <div className="mx-auto mt-6 max-w-5xl px-0 md:px-6">
          <div className="flex flex-col items-stretch justify-center gap-6 space-y-6 md:flex-row md:flex-wrap md:space-y-0 md:gap-8">

            {/* Wallet */}
            {services[0] && (
              <div className="w-full md:w-80">
                <ServiceCard
                  service={services[0]}
                  index={0}
                  isVisible={pageVisible}
                />
              </div>
            )}

            {/* Bank */}
            {services[2] && (
              <div className="w-full md:w-80">
                <ServiceCard
                  service={services[2]}
                  index={1}
                  isVisible={pageVisible}
                />
              </div>
            )}
          </div>
        </div>

        {/* =================================================
            TELECOM
        ================================================= */}
        {services[1] && (
          <div className="mt-6">
            <TelecomContributionsFeature
              title={t.telecomTitle}
              description={t.telecomDescription}
            />
          </div>
        )}
      </div>
    </section>
  );
}
