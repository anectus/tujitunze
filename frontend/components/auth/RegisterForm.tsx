
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { formatNidaNumber, NIDA_FORMATTED_LENGTH } from "@/lib/utils/nida";
import { isValidTanzanianPhoneNumber } from "@/lib/utils/formatPhone";
import { useLanguage } from "@/lib/context/LanguageContext";
import { registerFormTranslations } from "@/constants/translations/auth";
import { commonTranslations } from "@/constants/translations/common";
import { API_URL } from "@/lib/utils/api";
import FormField from "@/components/auth/FormField";
import Spinner from "@/components/auth/Spinner";
import { FullLogo } from "@/components/common/Logo";

type RequiredField =
  | "firstName"
  | "surname"
  | "phoneNumber"
  | "nidaNumber"
  | "email"
  | "password"
  | "confirmPassword";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SectionHeading({ index, title }: { index: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#064E3B] text-xs font-bold text-white">
        {index}
      </span>
      <h2 className="text-lg font-semibold text-[#064E3B]">{title}</h2>
    </div>
  );
}

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

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RequiredField, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<RequiredField, boolean>>>({});
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const validateField = (
    field: RequiredField,
    value: string,
    passwordValue: string
  ): string | undefined => {
    switch (field) {
      case "firstName":
        return value.trim() ? undefined : t.firstNameRequired;

      case "surname":
        return value.trim() ? undefined : t.surnameRequired;

      case "phoneNumber":
        if (!value.trim()) return t.phoneNumberRequired;
        return isValidTanzanianPhoneNumber(value) ? undefined : t.phoneNumberInvalid;

      case "nidaNumber":
        if (!value.trim()) return t.nidaNumberRequired;
        return value.length === NIDA_FORMATTED_LENGTH ? undefined : t.nidaNumberIncomplete;

      case "email":
        if (!value.trim()) return undefined; // optional field
        return EMAIL_PATTERN.test(value) ? undefined : t.emailInvalid;

      case "password":
        if (!value) return t.passwordRequired;
        return value.length >= 8 ? undefined : t.passwordTooShort;

      case "confirmPassword":
        if (!value) return t.confirmPasswordRequired;
        return value === passwordValue ? undefined : common.passwordsDontMatch;

      default:
        return undefined;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const field = name as RequiredField;

    const nextFormData = { ...formData, [name]: value };
    setFormData(nextFormData);

    setFieldErrors((previous) => {
      const next = { ...previous };

      if (touched[field]) {
        next[field] = validateField(field, value, nextFormData.password);
      }

      // Re-check confirmPassword live whenever password changes, since
      // its validity depends on the other field's value.
      if (field === "password" && touched.confirmPassword) {
        next.confirmPassword = validateField(
          "confirmPassword",
          nextFormData.confirmPassword,
          value
        );
      }

      return next;
    });

    setError("");
    setSuccess("");
  };

  // NIDA number — the user only types digits; the dashes (8-5-5-2) are
  // inserted automatically as they type.
  const handleNidaChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const formatted = formatNidaNumber(e.target.value);

    setFormData((previousData) => ({
      ...previousData,
      nidaNumber: formatted,
    }));

    if (touched.nidaNumber) {
      setFieldErrors((previous) => ({
        ...previous,
        nidaNumber: validateField("nidaNumber", formatted, formData.password),
      }));
    }

    setError("");
    setSuccess("");
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as RequiredField;

    setTouched((previous) => ({ ...previous, [field]: true }));

    setFieldErrors((previous) => ({
      ...previous,
      [field]: validateField(field, value, formData.password),
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const fieldsToValidate: RequiredField[] = [
      "firstName",
      "surname",
      "phoneNumber",
      "nidaNumber",
      "email",
      "password",
      "confirmPassword",
    ];

    const nextErrors: Partial<Record<RequiredField, string>> = {};
    fieldsToValidate.forEach((field) => {
      nextErrors[field] = validateField(field, formData[field], formData.password);
    });

    setFieldErrors(nextErrors);
    setTouched({
      firstName: true,
      surname: true,
      phoneNumber: true,
      nidaNumber: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    // Email only lives behind "Add more details" — if it's invalid, the
    // member needs to see the section that contains it.
    if (nextErrors.email && !showMoreDetails) {
      setShowMoreDetails(true);
    }

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/members/register`,
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
      setFieldErrors({});
      setTouched({});

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

        {/* Minimal logo + title (no marketing navbar on the auth page) */}
        <div className="text-center mb-8">

          <FullLogo href="/" className="justify-center" />

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
            <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-[#064E3B]">
              {success}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-8"
            noValidate
          >

            {/* Section 1 — Personal Info */}
            <div className="space-y-5">
              <SectionHeading index={1} title={t.sectionPersonalInfo} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  id="firstName"
                  name="firstName"
                  label={t.firstName}
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t.firstNamePlaceholder}
                  autoComplete="given-name"
                  error={fieldErrors.firstName}
                  valid={touched.firstName && !!formData.firstName.trim()}
                />

                <FormField
                  id="surname"
                  name="surname"
                  label={t.surname}
                  value={formData.surname}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t.surnamePlaceholder}
                  autoComplete="family-name"
                  error={fieldErrors.surname}
                  valid={touched.surname && !!formData.surname.trim()}
                />
              </div>

              <FormField
                id="phoneNumber"
                name="phoneNumber"
                label={t.phoneNumber}
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={t.phoneNumberPlaceholder}
                autoComplete="tel"
                error={fieldErrors.phoneNumber}
                valid={touched.phoneNumber && isValidTanzanianPhoneNumber(formData.phoneNumber)}
                helpText={t.phoneNumberHelp}
              />

              <FormField
                id="nidaNumber"
                name="nidaNumber"
                label={t.nidaNumber}
                inputMode="numeric"
                value={formData.nidaNumber}
                onChange={handleNidaChange}
                onBlur={handleBlur}
                placeholder={t.nidaNumberPlaceholder}
                maxLength={NIDA_FORMATTED_LENGTH}
                error={fieldErrors.nidaNumber}
                valid={touched.nidaNumber && formData.nidaNumber.length === NIDA_FORMATTED_LENGTH}
                helpText={t.nidaNumberHelp}
              />

              <button
                type="button"
                onClick={() => setShowMoreDetails((visible) => !visible)}
                className="text-sm font-semibold text-[#064E3B] hover:text-[#065F46] transition-colors duration-300 ease-in-out"
              >
                {showMoreDetails ? t.showLessDetails : t.addMoreDetails}
              </button>

              {showMoreDetails && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    id="secondName"
                    name="secondName"
                    label={t.secondName}
                    optionalLabel={t.optional}
                    value={formData.secondName}
                    onChange={handleChange}
                    placeholder={t.secondNamePlaceholder}
                    autoComplete="additional-name"
                  />

                  <FormField
                    id="email"
                    name="email"
                    label={t.email}
                    type="email"
                    optionalLabel={t.optional}
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t.emailPlaceholder}
                    autoComplete="email"
                    error={fieldErrors.email}
                    valid={touched.email && !!formData.email.trim() && EMAIL_PATTERN.test(formData.email)}
                  />
                </div>
              )}
            </div>

            {/* Section 2 — Account Setup */}
            <div className="space-y-5 border-t border-gray-200 pt-6">
              <SectionHeading index={2} title={t.sectionAccountSetup} />

              <FormField
                id="password"
                name="password"
                label={t.password}
                type="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={t.passwordPlaceholder}
                autoComplete="new-password"
                error={fieldErrors.password}
                helpText={t.passwordHelp}
              />

              <FormField
                id="confirmPassword"
                name="confirmPassword"
                label={t.confirmPassword}
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={t.confirmPasswordPlaceholder}
                autoComplete="new-password"
                error={fieldErrors.confirmPassword}
              />
            </div>

            {/* Section 3 — Agreement */}
            <div className="space-y-5 border-t border-gray-200 pt-6">
              <SectionHeading index={3} title={t.sectionAgreement} />

              <div className="flex items-start gap-3">

                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 rounded border-gray-300
                  text-[#064E3B] focus:ring-[#064E3B]"
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
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#064E3B] px-6 py-3.5
                text-lg font-semibold text-white transition-colors duration-300 ease-in-out
                hover:bg-[#065F46] disabled:cursor-not-allowed
                disabled:opacity-60"
              >
                {loading && <Spinner />}
                {loading ? t.submitting : t.submit}
              </button>
            </div>

          </form>

          {/* Login */}
          <div className="mt-8 text-center">

            <p className="text-sm text-gray-600">
              {t.alreadyHaveAccount}{" "}

              <Link
                href="/login"
                className="font-semibold text-[#064E3B]
                hover:text-[#065F46] hover:underline"
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
