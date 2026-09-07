
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ACCESS_TOKEN_STORAGE_KEY,
  decodeAccessToken,
  getStaffDashboardPath,
  storeAuthUser,
} from "@/lib/utils/permissions";
import { useLanguage } from "@/lib/context/LanguageContext";
import { loginFormTranslations } from "@/constants/translations/auth";
import { API_URL } from "@/lib/utils/api";
import FormField from "@/components/auth/FormField";
import Spinner from "@/components/auth/Spinner";

type FieldName = "identifier" | "password";

export default function LoginForm() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = loginFormTranslations[language];

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const validateField = (field: FieldName, value: string): string | undefined => {
    if (field === "identifier" && !value.trim()) {
      return t.usernameRequired;
    }

    if (field === "password" && !value) {
      return t.passwordRequired;
    }

    return undefined;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const field = name as FieldName;

    setFormData((previousData) => ({
      ...previousData,
      [field]: value,
    }));

    if (touched[field]) {
      setFieldErrors((previous) => ({
        ...previous,
        [field]: validateField(field, value),
      }));
    }

    setError("");
    setSuccess("");
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as FieldName;

    setTouched((previous) => ({ ...previous, [field]: true }));

    setFieldErrors((previous) => ({
      ...previous,
      [field]: validateField(field, value),
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const nextErrors: Partial<Record<FieldName, string>> = {
      identifier: validateField("identifier", formData.identifier),
      password: validateField("password", formData.password),
    };

    setFieldErrors(nextErrors);
    setTouched({ identifier: true, password: true });

    if (nextErrors.identifier || nextErrors.password) {
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: formData.identifier,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.errorFallback);
      }

      setSuccess(t.successMessage);

      sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, data.accessToken);

      const payload = decodeAccessToken(data.accessToken);

      if (payload) {
        storeAuthUser({
          userId: payload.sub,
          roles: payload.roles,
          firstName: payload.firstName || data.member?.firstName || "",
        });
      }

      const staffDashboardPath = getStaffDashboardPath(payload?.roles ?? []);

      // Every role lands on its own dashboard right after login: staff
      // roles via getStaffDashboardPath (their tenant-scoped
      // /<role>/dashboard), Members on the bare /dashboard they own per
      // the route-group table in CLAUDE.md. All paths here are relative —
      // never a hardcoded origin — so this redirect works unchanged across
      // dev, staging, and production.
      router.push(staffDashboardPath ?? "/dashboard");

    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(t.genericErrorFallback);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-white px-6 py-12">

      <div className="w-full max-w-md">

        {/* Minimal logo + title (no marketing navbar on the auth page) */}
        <div className="text-center mb-8">

          <Link
            href="/"
            className="text-2xl font-bold text-[#064E3B] tracking-tight"
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

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

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

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            noValidate
          >

            {/* NIDA Number or Email */}
            <FormField
              id="identifier"
              name="identifier"
              label={t.usernameLabel}
              value={formData.identifier}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={t.usernamePlaceholder}
              autoComplete="username"
              error={fieldErrors.identifier}
              valid={touched.identifier && !!formData.identifier.trim()}
              helpText={t.usernameHelp}
            />

            {/* Password */}
            <div>

              <div className="flex items-center justify-between mb-2">

                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700"
                >
                  {t.passwordLabel}
                </label>

                <Link
                  href="/forgot-password"
                  className="text-sm text-[#064E3B] hover:text-[#065F46] hover:underline"
                >
                  {t.forgotPassword}
                </Link>

              </div>

              <FormField
                id="password"
                name="password"
                label=""
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={t.passwordPlaceholder}
                autoComplete="current-password"
                error={fieldErrors.password}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? t.hidePassword : t.showPassword}
                    aria-pressed={showPassword}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >

                    {showPassword ? (

                      // Eye-off icon
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>

                    ) : (

                      // Eye icon
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>

                    )}

                  </button>
                }
              />

            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3">

              <input
                id="rememberMe"
                type="checkbox"
                className="
                  h-4
                  w-4
                  rounded
                  border-gray-300
                  text-[#064E3B]
                  focus:ring-[#064E3B]
                "
              />

              <label
                htmlFor="rememberMe"
                className="text-sm text-gray-600"
              >
                {t.rememberMe}
              </label>

            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                flex
                items-center
                justify-center
                gap-2
                bg-[#064E3B]
                text-white
                py-3
                rounded-lg
                font-semibold
                hover:bg-[#065F46]
                transition-colors
                duration-300
                ease-in-out
                focus:outline-none
                focus:ring-2
                focus:ring-[#064E3B]
                focus:ring-offset-2
                disabled:opacity-60
                disabled:cursor-not-allowed
              "
            >
              {loading && <Spinner />}
              {loading ? t.loggingIn : t.loginButton}
            </button>

          </form>

          {/* Sign Up */}
          <div className="mt-8 text-center">

            <p className="text-sm text-gray-600">

              {t.noAccount}{" "}

              <Link
                href="/register"
                className="font-semibold text-[#064E3B] hover:text-[#065F46] hover:underline"
              >
                {t.signUp}
              </Link>

            </p>

          </div>

        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t.copyright}
        </p>

      </div>

    </section>
  );
}
