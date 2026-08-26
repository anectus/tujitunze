
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { formatNidaNumber, NIDA_FORMATTED_LENGTH } from "@/lib/utils/nida";
import { useLanguage } from "@/lib/context/LanguageContext";
import { registerFormTranslations } from "@/constants/translations/auth";
import { commonTranslations } from "@/constants/translations/common";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 " +
  "text-gray-900 outline-none transition " +
  "focus:border-blue-700 focus:ring-2 focus:ring-blue-200";

export default function RegisterForm() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = registerFormTranslations[language];
  const common = commonTranslations[language];

  const [formData, setFormData] = useState({
    firstName: "",
    secondName: "",
    surname: "",
    phoneNumber: "",
    nidaNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // NIDA number — the user only types digits; the dashes (8-5-5-2) are
  // inserted automatically as they type.
  const handleNidaChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((previousData) => ({
      ...previousData,
      nidaNumber: formatNidaNumber(e.target.value),
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError(common.passwordsDontMatch);
      return;
    }

    if (formData.password.length < 8) {
      setError(t.passwordTooShort);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:3002/members/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            secondName: formData.secondName || undefined,
            surname: formData.surname,
            phoneNumber: formData.phoneNumber,
            nidaNumber: formData.nidaNumber,
            email: formData.email || undefined,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.errorFallback);
      }

      setSuccess(t.successMessage);

      setFormData({
        firstName: "",
        secondName: "",
        surname: "",
        phoneNumber: "",
        nidaNumber: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(common.somethingWentWrong);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-12">

      <div className="max-w-2xl mx-auto">

        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>

        {/* Minimal logo + title (no marketing navbar on the auth page) */}
        <div className="text-center mb-8">

          <Link
            href="/"
            className="text-2xl font-bold text-blue-700 tracking-tight"
          >
            Tujitunze
          </Link>

          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            {t.title}
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            {t.subtitle}
          </p>

        </div>

        {/* Sign Up Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10">

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-6 rounded-lg bg-blue-100 px-4 py-3 text-sm text-blue-700">
              {success}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* First Name */}
            <div>
              <label
                htmlFor="firstName"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                {t.firstName}
              </label>

              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                placeholder={t.firstNamePlaceholder}
                required
                autoComplete="given-name"
                className={inputClass}
              />
            </div>

            {/* Second Name */}
            <div>
              <label
                htmlFor="secondName"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                {t.secondName}
                <span className="ml-2 text-xs font-normal text-gray-500">
                  {t.optional}
                </span>
              </label>

              <input
                id="secondName"
                name="secondName"
                type="text"
                value={formData.secondName}
                onChange={handleChange}
                placeholder={t.secondNamePlaceholder}
                autoComplete="additional-name"
                className={inputClass}
              />
            </div>

            {/* Surname */}
            <div>
              <label
                htmlFor="surname"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                {t.surname}
              </label>

              <input
                id="surname"
                name="surname"
                type="text"
                value={formData.surname}
                onChange={handleChange}
                placeholder={t.surnamePlaceholder}
                required
                autoComplete="family-name"
                className={inputClass}
              />
            </div>

            {/* Phone Number — registration collects exactly one. Add more
                from your profile after signing up. */}
            <div>
              <label
                htmlFor="phoneNumber"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                {t.phoneNumber}
              </label>

              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder={t.phoneNumberPlaceholder}
                required
                autoComplete="tel"
                className={inputClass}
              />

              <p className="mt-1 text-xs text-gray-500">
                {t.phoneNumberHelp}
              </p>
            </div>

            {/* NIDA */}
            <div>
              <label
                htmlFor="nidaNumber"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                {t.nidaNumber}
              </label>

              <input
                id="nidaNumber"
                name="nidaNumber"
                type="text"
                inputMode="numeric"
                value={formData.nidaNumber}
                onChange={handleNidaChange}
                placeholder={t.nidaNumberPlaceholder}
                maxLength={NIDA_FORMATTED_LENGTH}
                required
                className={inputClass}
              />

              <p className="mt-1 text-xs text-gray-500">
                {t.nidaNumberHelp}
              </p>
            </div>

            {/* Email - Optional */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                {t.email}
                <span className="ml-2 text-xs font-normal text-gray-500">
                  {t.optional}
                </span>
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t.emailPlaceholder}
                autoComplete="email"
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                {t.password}
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t.passwordPlaceholder}
                required
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
              />

              <p className="mt-1 text-xs text-gray-500">
                {t.passwordHelp}
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                {t.confirmPassword}
              </label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder={t.confirmPasswordPlaceholder}
                required
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">

              <input
                id="terms"
                type="checkbox"
                required
                className="mt-1 h-4 w-4 rounded border-gray-300
                text-blue-700 focus:ring-blue-600"
              />

              <label
                htmlFor="terms"
                className="text-sm leading-5 text-gray-600"
              >
                {t.termsLabel}
              </label>

            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-700 px-6 py-3.5
              text-lg font-semibold text-white transition
              hover:bg-blue-800 disabled:cursor-not-allowed
              disabled:opacity-60"
            >
              {loading ? t.submitting : t.submit}
            </button>

          </form>

          {/* Login */}
          <div className="mt-8 text-center">

            <p className="text-sm text-gray-600">
              {t.alreadyHaveAccount}{" "}

              <Link
                href="/login"
                className="font-semibold text-blue-700
                hover:text-blue-800 hover:underline"
              >
                {t.login}
              </Link>

            </p>

          </div>

        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t.copyright}
        </p>

      </div>

    </div>
  );
}
