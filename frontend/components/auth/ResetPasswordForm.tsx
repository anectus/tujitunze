"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/context/LanguageContext";
import { resetPasswordTranslations } from "@/constants/translations/auth";
import { API_URL } from "@/lib/utils/api";
import { FullLogo } from "@/components/common/Logo";

function EyeIcon({ off }: { off: boolean }) {
  return off ? (
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
  );
}

export default function ResetPasswordForm() {
  const { language } = useLanguage();
  const t = resetPasswordTranslations[language];
  const searchParams = useSearchParams();
  const token =
    searchParams.get("token") ?? searchParams.get("resetToken") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!token) return setError(t.invalidLink);
    if (password !== confirmation) return setError(t.passwordMismatch);
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || t.error);
      setMessage(body.message || t.success);
      setPassword("");
      setConfirmation("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
          <FullLogo href="/login" />
          <h1 className="mt-6 text-3xl font-bold text-gray-900">{t.title}</h1>
          <p className="mt-2 text-sm text-gray-600">{t.description}</p>
          {error && <p className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>}
          {message && <p className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-[#064E3B]">{message}</p>}
          {!message && <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="block text-sm font-semibold text-gray-700">
              {t.password}
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-11 text-gray-900 outline-none transition-colors focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? t.hidePassword : t.showPassword}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition"
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
            </label>
            <label className="block text-sm font-semibold text-gray-700">
              {t.confirmPassword}
              <div className="relative mt-2">
                <input
                  type={showConfirmation ? "text" : "password"}
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-11 text-gray-900 outline-none transition-colors focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmation((visible) => !visible)}
                  aria-label={showConfirmation ? t.hidePassword : t.showPassword}
                  aria-pressed={showConfirmation}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition"
                >
                  <EyeIcon off={showConfirmation} />
                </button>
              </div>
            </label>
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#064E3B] py-3 font-semibold text-white transition-colors duration-300 ease-in-out hover:bg-[#065F46] focus:outline-none focus:ring-2 focus:ring-[#064E3B] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">{loading ? t.submitting : t.submit}</button>
          </form>}
          {message && <Link href="/login" className="mt-6 block text-center text-sm font-semibold text-[#064E3B] hover:text-[#065F46] hover:underline">{t.backToLogin}</Link>}
        </div>
      </div>
    </main>
  );
}
