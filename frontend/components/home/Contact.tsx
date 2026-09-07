
"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { Building, Clock, Mail, MapPin, PhoneCall, Zap } from "lucide-react";

import { useAuth } from "@/lib/hooks/useAuth";
import { getAccessToken } from "@/lib/utils/permissions";
import { useLanguage } from "@/lib/context/LanguageContext";
import {
  CONTACT_CATEGORIES,
  contactCategoryLabelTranslations,
  contactTranslations,
} from "@/constants/translations/public-contact";
import { API_URL } from "@/lib/utils/api";

// Lazy-loaded: purely decorative (aria-hidden), no reason to block the
// initial paint of the actual heading/form content.
const ContactIllustration = dynamic(
  () => import("@/components/home/ContactIllustration"),
  {
    loading: () => (
      <div
        aria-hidden="true"
        className="aspect-[480/420] w-full animate-pulse rounded-3xl bg-emerald-100/60"
      />
    ),
  }
);

const inputClass =
  "w-full border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 outline-none transition-colors duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2";

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

// Reused from About.tsx's card treatment: a gradient-bordered card (a
// 2px gradient-filled wrapper around a white inset, since CSS borders
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
      className="group rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-200 p-[2px] shadow-md transition-shadow duration-300 hover:shadow-xl"
    >
      <div className={`h-full rounded-[calc(1rem-2px)] bg-white ${className}`}>
        {children}
      </div>
    </motion.div>
  );
}

function IconBadge({ icon: Icon }: { icon: typeof Building }) {
  return (
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-[0_0_0_6px_rgba(16,185,129,0.1)] transition-transform duration-300 group-hover:rotate-12">
      <Icon className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
    </div>
  );
}

export default function Contact() {
  const { isAuthenticated, firstName } = useAuth();
  const { language } = useLanguage();
  const t = contactTranslations[language];
  const categoryLabels = contactCategoryLabelTranslations[language];

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const illustrationY = useTransform(scrollYProgress, [0, 1], [0, -30]);

  // Only relevant for a guest sender — a logged-in member's name/email
  // are resolved server-side from their verified account, they only
  // need to type the message itself.
  const [guestDetails, setGuestDetails] = useState({
    name: "",
    email: "",
    phone: "",
    nidaNumber: "",
  });

  const [form, setForm] = useState({
    category: "",
    subject: "",
    message: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGuestChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setGuestDetails((previous) => ({ ...previous, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isAuthenticated && (!guestDetails.name.trim() || !guestDetails.email.trim())) {
      setError(t.nameEmailRequiredError);
      return;
    }

    try {
      setLoading(true);

      const token = getAccessToken();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: isAuthenticated ? undefined : guestDetails.name,
          email: isAuthenticated ? undefined : guestDetails.email,
          phone: isAuthenticated ? undefined : guestDetails.phone || undefined,
          nidaNumber: isAuthenticated
            ? undefined
            : guestDetails.nidaNumber || undefined,
          category: form.category,
          subject: form.subject,
          message: form.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.genericSendError);
      }

      setSuccess(data.message || t.genericSendSuccess);
      setForm({ category: "", subject: "", message: "" });
      setGuestDetails({ name: "", email: "", phone: "", nidaNumber: "" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.genericSendError
      );
    } finally {
      setLoading(false);
    }
  };

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
              {t.heading}
            </h1>

            <p className="mt-6 max-w-xl text-base font-medium text-gray-600 leading-[1.7] max-md:mx-auto">
              {t.intro}
            </p>
          </motion.div>

          <motion.div style={{ y: illustrationY }} className="drop-shadow-xl">
            <ContactIllustration />
          </motion.div>
        </div>

        {/* Information Cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ staggerChildren: 0.12 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16"
        >

          <motion.div variants={FADE_UP}>
            <GradientCard className="p-6 md:p-8 text-center">
              <IconBadge icon={Building} />

              <h3 className="mt-4 text-[22px] font-semibold text-gray-800">
                {t.headquartersTitle}
              </h3>

              <p className="mt-4 text-base font-medium text-gray-600 leading-[1.7]">
                {t.headquartersBody}
                <br />
                {t.city}
                <br />
                {t.country}
              </p>
            </GradientCard>
          </motion.div>

          <motion.div variants={FADE_UP}>
            <GradientCard className="p-6 md:p-8 text-center">
              <IconBadge icon={Clock} />

              <h3 className="mt-4 text-[22px] font-semibold text-gray-800">
                {t.officeHoursTitle}
              </h3>

              <p className="mt-4 text-base font-medium text-gray-600 leading-[1.7]">
                {t.officeHoursDays}
                <br />
                {t.officeHoursTime}
              </p>

              <p className="mt-4 text-base font-medium text-gray-600 leading-[1.7]">
                {t.officeHoursNote}
              </p>
            </GradientCard>
          </motion.div>

          <motion.div variants={FADE_UP}>
            <GradientCard className="p-6 md:p-8 text-center">
              <IconBadge icon={Zap} />

              <h3 className="mt-4 text-[22px] font-semibold text-gray-800">
                {t.responseTimeTitle}
              </h3>

              <p className="mt-4 text-base font-medium text-gray-600 leading-[1.7]">
                {t.generalEnquiriesLabel}
                <strong> {t.generalEnquiriesValue}</strong>
              </p>

              <p className="mt-3 text-base font-medium text-gray-600 leading-[1.7]">
                {t.priorityNote}
              </p>
            </GradientCard>
          </motion.div>

        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-20">

          {/* Contact Details */}
          <FadeIn>
            <GradientCard className="p-6 md:p-8">
              <h2 className="text-[22px] font-semibold text-gray-800 mb-8">
                {t.contactInfoTitle}
              </h2>

              <div className="space-y-8">

                <div className="flex gap-4">
                  <MapPin className="h-5 w-5 md:h-6 md:w-6 shrink-0 text-emerald-600 transition-colors duration-200" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold text-xl text-gray-900">
                      {t.addressTitle}
                    </h3>
                    <p className="mt-2 text-base font-medium text-gray-600 leading-[1.7]">
                      {t.headquartersBody}
                      <br />
                      {t.city}
                      <br />
                      {t.country}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Mail className="h-5 w-5 md:h-6 md:w-6 shrink-0 text-emerald-600 transition-colors duration-200" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold text-xl text-gray-900">
                      {t.generalSupportTitle}
                    </h3>
                    <p className="mt-2 text-base font-medium text-gray-600 leading-[1.7]">
                      tujitunze@gmail.com
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Mail className="h-5 w-5 md:h-6 md:w-6 shrink-0 text-emerald-600 transition-colors duration-200" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold text-xl text-gray-900">
                      {t.technicalSupportTitle}
                    </h3>
                    <p className="mt-2 text-base font-medium text-gray-600 leading-[1.7]">
                      tujitunze@gmail.com
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <PhoneCall className="h-5 w-5 md:h-6 md:w-6 shrink-0 text-emerald-600 transition-colors duration-200" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold text-xl text-gray-900">
                      {t.telephoneTitle}
                    </h3>
                    <p className="mt-2 text-base font-medium text-gray-600 leading-[1.7]">
                      +255 756 801 149
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-xl text-gray-900">
                    {t.weSupportTitle}
                  </h3>

                  <ul className="mt-3 space-y-2 text-base font-medium text-gray-600 leading-[1.7] list-disc list-inside">
                    {t.supportList.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

              </div>
            </GradientCard>
          </FadeIn>

          {/* Contact Form */}
          <FadeIn>
            <GradientCard className="p-6 md:p-8">
              <h2 className="text-[22px] font-semibold text-gray-800 mb-8">
                {t.sendMessageTitle}
              </h2>

              <p className="text-base font-medium text-gray-600 leading-[1.7] mb-8">
                {t.sendMessageIntro}
              </p>

              {isAuthenticated && (
                <div className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {t.sendingAsPrefix} {firstName || t.yourAccount} {t.sendingAsSuffix}
                </div>
              )}

              {error && (
                <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="mb-6 rounded-lg bg-emerald-100 px-4 py-3 text-sm font-medium text-emerald-800 shadow-md"
                  >
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-6">

                {!isAuthenticated && (
                  <>
                    <input
                      type="text"
                      name="name"
                      value={guestDetails.name}
                      onChange={handleGuestChange}
                      placeholder={t.fullNamePlaceholder}
                      aria-label={t.fullNamePlaceholder}
                      required
                      className={inputClass}
                    />

                    <input
                      type="text"
                      name="nidaNumber"
                      value={guestDetails.nidaNumber}
                      onChange={handleGuestChange}
                      placeholder={t.nationalIdPlaceholder}
                      aria-label={t.nationalIdPlaceholder}
                      className={inputClass}
                    />

                    <input
                      type="email"
                      name="email"
                      value={guestDetails.email}
                      onChange={handleGuestChange}
                      placeholder={t.emailPlaceholder}
                      aria-label={t.emailPlaceholder}
                      required
                      className={inputClass}
                    />

                    <input
                      type="tel"
                      name="phone"
                      value={guestDetails.phone}
                      onChange={handleGuestChange}
                      placeholder={t.phonePlaceholder}
                      aria-label={t.phonePlaceholder}
                      className={inputClass}
                    />
                  </>
                )}

                <select
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  aria-label={t.selectCategoryPlaceholder}
                  required
                  className={inputClass}
                >
                  <option value="" disabled>
                    {t.selectCategoryPlaceholder}
                  </option>
                  {CONTACT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {categoryLabels[category]}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleFormChange}
                  placeholder={t.subjectPlaceholder}
                  aria-label={t.subjectPlaceholder}
                  required
                  className={inputClass}
                />

                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleFormChange}
                  rows={6}
                  placeholder={t.messagePlaceholder}
                  aria-label={t.messagePlaceholder}
                  required
                  className={inputClass}
                />

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { y: -2 } : undefined}
                  className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-full font-semibold shadow-lg transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`}
                >
                  {loading ? t.sending : t.submitEnquiry}
                </motion.button>

              </form>
            </GradientCard>
          </FadeIn>

        </div>

      </div>

    </section>
  );
}
