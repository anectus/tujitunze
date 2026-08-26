"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { servicesTranslations } from "@/constants/translations/home";
import { useLanguage } from "@/lib/context/LanguageContext";

const serviceMeta = [
  {
    icon: "💳",
    link: "/wallet",
    accent: "blue",
  },
  {
    icon: "📱",
    link: "/contributions",
    accent: "cyan",
  },
  {
    icon: "🏦",
    link: "/banks",
    accent: "emerald",
  },
] as const;

const TELECOM_LINK = "/contributions";

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
  cta,
}: {
  title: string;
  description: string;
  cta: string;
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
      className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-100/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl" />
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
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />

            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-800">
              TUJITUNZE
            </span>
          </div>

          {/* Heading */}
          <h3 className="max-w-xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-[42px] lg:leading-[1.08]">
            {title}
          </h3>

          {/* Accent line */}
          <div className="mx-auto mt-4 h-1 w-14 rounded-full bg-gradient-to-r from-blue-700 to-cyan-500 md:mx-0" />

          {/* Description */}
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base md:mx-0 md:text-[15px] lg:text-base">
            {description}
          </p>

          {/* Flow */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-slate-500 md:justify-start">
            <span className="rounded-full bg-slate-100 px-3 py-1.5">
              People
            </span>

            <span className="text-cyan-600">→</span>

            <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-cyan-800">
              Telecom
            </span>

            <span className="text-cyan-600">→</span>

            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-800">
              Contribution
            </span>

            <span className="text-cyan-600">→</span>

            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-800">
              Health Fund
            </span>
          </div>

          {/* CTA */}
          <Link
            href={TELECOM_LINK}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-xl active:translate-y-0"
          >
            {cta}

            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        {/* =================================================
            IMAGE
        ================================================= */}
        <div
          className={`order-2 px-4 pb-5 sm:px-6 sm:pb-6 md:px-5 md:py-5 lg:px-6 lg:py-6 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`relative mx-auto aspect-[4/3] w-full max-w-[520px] overflow-hidden rounded-[20px] bg-slate-100 transition-all duration-1000 ease-out ${
              visible
                ? "translate-x-0 scale-100"
                : "translate-x-8 scale-[0.96]"
            }`}
          >
            <Image
              src={TELECOM_IMAGE}
              alt={title}
              fill
              className="object-cover transition-transform duration-700 hover:scale-[1.025]"
              sizes="
                (max-width: 767px) 100vw,
                (max-width: 1023px) 50vw,
                520px
              "
            />

            {/* Very subtle image overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />

            {/* Image corner accent */}
            <div className="absolute bottom-4 left-4 h-1 w-12 rounded-full bg-white/90" />
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
  learnMore,
}: {
  service: any;
  index: number;
  isVisible: boolean;
  learnMore: string;
}) {
  const accentStyles = {
    blue: {
      icon: "bg-blue-50 text-blue-700",
      border: "border-blue-100 hover:border-blue-300",
      hover: "hover:shadow-blue-100/60",
      line: "bg-blue-600",
    },

    cyan: {
      icon: "bg-cyan-50 text-cyan-700",
      border: "border-cyan-100 hover:border-cyan-300",
      hover: "hover:shadow-cyan-100/60",
      line: "bg-cyan-600",
    },

    emerald: {
      icon: "bg-emerald-50 text-emerald-700",
      border: "border-emerald-100 hover:border-emerald-300",
      hover: "hover:shadow-emerald-100/60",
      line: "bg-emerald-600",
    },
  };

  const style =
    accentStyles[service.accent as keyof typeof accentStyles];

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-[0_10px_35px_-25px_rgba(15,23,42,0.5)] transition-all duration-500 hover:-translate-y-1 hover:shadow-xl ${style.border} ${style.hover} ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-5 opacity-0"
      }`}
      style={{
        transitionDelay: `${index * 100}ms`,
      }}
    >
      {/* Top accent */}
      <div
        className={`absolute left-5 right-5 top-0 h-[2px] ${style.line} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
      />

      {/* Icon */}
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${style.icon}`}
      >
        {service.icon}
      </div>

      {/* Content */}
      <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-950">
        {service.title}
      </h3>

      <p className="mt-2 text-sm leading-5 text-slate-600">
        {service.description}
      </p>

      <Link
        href={service.link}
        className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700 transition-all duration-300 hover:gap-3"
      >
        {learnMore}
        <span>→</span>
      </Link>
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
    <section className="bg-slate-50 px-3 py-7 sm:px-4 sm:py-8 md:px-6 md:py-9 lg:px-8 lg:py-10">
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
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />

            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-800">
              Services
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
            {t.heading}
          </h2>

          <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-blue-700 to-cyan-500" />

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            {t.description}
          </p>
        </div>

        {/* =================================================
            SERVICES GRID
        ================================================= */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

          {/* Wallet */}
          {services[0] && (
            <ServiceCard
              service={services[0]}
              index={0}
              isVisible={pageVisible}
              learnMore={t.learnMore}
            />
          )}

          {/* Bank */}
          {services[2] && (
            <ServiceCard
              service={services[2]}
              index={1}
              isVisible={pageVisible}
              learnMore={t.learnMore}
            />
          )}

          {/* =================================================
              TELECOM
          ================================================= */}
          {services[1] && (
            <div className="md:col-span-2 lg:col-span-3">
              <TelecomContributionsFeature
                title={t.telecomTitle}
                description={t.telecomDescription}
                cta={t.learnMore}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}