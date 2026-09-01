
"use client";

import { useState } from "react";

import { useAuth } from "@/lib/hooks/useAuth";
import { getAccessToken } from "@/lib/utils/permissions";
import { useLanguage } from "@/lib/context/LanguageContext";
import {
  CONTACT_CATEGORIES,
  contactCategoryLabelTranslations,
  contactTranslations,
} from "@/constants/translations/public-contact";

const inputClass =
  "w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 outline-none";

export default function Contact() {
  const { isAuthenticated, firstName } = useAuth();
  const { language } = useLanguage();
  const t = contactTranslations[language];
  const categoryLabels = contactCategoryLabelTranslations[language];

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

      const response = await fetch("http://localhost:3002/contact", {
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
    <section className="bg-white pt-36 pb-20 px-12">

      <div className="max-w-7xl mx-auto px-6">

        {/* Page Heading */}
        <div className="text-center max-w-4xl mx-auto">

          <h1 className="text-5xl font-bold text-gray-900">
            {t.heading}
          </h1>

          <p className="mt-6 text-lg text-gray-600 leading-8">
            {t.intro}
          </p>

        </div>

        {/* Information Cards */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">

          <div className="bg-white rounded-2xl shadow-lg p-8">

            <h3 className="text-2xl font-bold text-blue-700">
              {t.headquartersTitle}
            </h3>

            <p className="mt-4 text-gray-600 leading-7">
              {t.headquartersBody}
              <br />
              {t.city}
              <br />
              {t.country}
            </p>

          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">

            <h3 className="text-2xl font-bold text-blue-700">
              {t.officeHoursTitle}
            </h3>

            <p className="mt-4 text-gray-600">
              {t.officeHoursDays}
              <br />
              {t.officeHoursTime}
            </p>

            <p className="mt-4 text-gray-600">
              {t.officeHoursNote}
            </p>

          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">

            <h3 className="text-2xl font-bold text-blue-700">
              {t.responseTimeTitle}
            </h3>

            <p className="mt-4 text-gray-600">
              {t.generalEnquiriesLabel}
              <strong> {t.generalEnquiriesValue}</strong>
            </p>

            <p className="mt-3 text-gray-600">
              {t.priorityNote}
            </p>

          </div>

        </div>

        {/* Main Content */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-20">

          {/* Contact Details */}

          <div className="bg-white rounded-2xl shadow-lg p-8">

            <h2 className="text-3xl font-bold text-blue-700 mb-8">
              {t.contactInfoTitle}
            </h2>

            <div className="space-y-8">

              <div>

                <h3 className="font-semibold text-xl">
                  {t.addressTitle}
                </h3>

                <p className="mt-2 text-gray-600">
                  {t.headquartersBody}
                  <br />
                  {t.city}
                  <br />
                  {t.country}
                </p>

              </div>

              <div>

                <h3 className="font-semibold text-xl">
                  {t.generalSupportTitle}
                </h3>

                <p className="mt-2 text-gray-600">
                  support@Tujitunze.co.tz
                </p>

              </div>

              <div>

                <h3 className="font-semibold text-xl">
                  {t.technicalSupportTitle}
                </h3>

                <p className="mt-2 text-gray-600">
                  techsupport@Tujitunze.co.tz
                </p>

              </div>

              <div>

                <h3 className="font-semibold text-xl">
                  {t.telephoneTitle}
                </h3>

                <p className="mt-2 text-gray-600">
                  +255 617 672 872
                </p>

              </div>

              <div>

                <h3 className="font-semibold text-xl">
                  {t.weSupportTitle}
                </h3>

                <ul className="mt-3 space-y-2 text-gray-600 list-disc list-inside">

                  {t.supportList.map((item) => (
                    <li key={item}>{item}</li>
                  ))}

                </ul>

              </div>

            </div>

          </div>

          {/* Contact Form */}

          <div className="bg-white rounded-2xl shadow-lg p-8">

            <h2 className="text-3xl font-bold text-blue-700 mb-8">
              {t.sendMessageTitle}
            </h2>

            <p className="text-gray-600 mb-8">
              {t.sendMessageIntro}
            </p>

            {isAuthenticated && (
              <div className="mb-6 rounded-lg bg-blue-100 px-4 py-3 text-sm text-blue-700">
                {t.sendingAsPrefix} {firstName || t.yourAccount} {t.sendingAsSuffix}
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-lg bg-blue-100 px-4 py-3 text-sm text-blue-700">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {!isAuthenticated && (
                <>
                  <input
                    type="text"
                    name="name"
                    value={guestDetails.name}
                    onChange={handleGuestChange}
                    placeholder={t.fullNamePlaceholder}
                    required
                    className={inputClass}
                  />

                  <input
                    type="text"
                    name="nidaNumber"
                    value={guestDetails.nidaNumber}
                    onChange={handleGuestChange}
                    placeholder={t.nationalIdPlaceholder}
                    className={inputClass}
                  />

                  <input
                    type="email"
                    name="email"
                    value={guestDetails.email}
                    onChange={handleGuestChange}
                    placeholder={t.emailPlaceholder}
                    required
                    className={inputClass}
                  />

                  <input
                    type="tel"
                    name="phone"
                    value={guestDetails.phone}
                    onChange={handleGuestChange}
                    placeholder={t.phonePlaceholder}
                    className={inputClass}
                  />
                </>
              )}

              <select
                name="category"
                value={form.category}
                onChange={handleFormChange}
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
                required
                className={inputClass}
              />

              <textarea
                name="message"
                value={form.message}
                onChange={handleFormChange}
                rows={6}
                placeholder={t.messagePlaceholder}
                required
                className={inputClass}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white py-4 rounded-lg font-semibold transition duration-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t.sending : t.submitEnquiry}
              </button>

            </form>

          </div>

        </div>

      </div>

    </section>
  );
}
