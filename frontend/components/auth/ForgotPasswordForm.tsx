"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/context/LanguageContext";
import { forgotPasswordTranslations } from "@/constants/translations/auth";
import Spinner from "@/components/auth/Spinner";
import { API_URL } from "@/lib/utils/api";
import { FullLogo } from "@/components/common/Logo";

export default function ForgotPasswordForm() {
  const { language } = useLanguage();
  const t = forgotPasswordTranslations[language];
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneFlow, setPhoneFlow] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const body = await response.json();
      if (!response.ok) {
        if (response.status === 503) {
          // The backend returns a channel-specific 503 message ("...email
          // service..." vs "...SMS service...") depending on which branch
          // (identifier.includes("@")) handled the request — mirror that
          // same detection here so we show the right one instead of always
          // showing the email-service message for a phone request.
          throw new Error(
            identifier.includes("@") ? t.emailUnavailable : t.smsUnavailable,
          );
        }
        throw new Error(body.message || t.error);
      }
      if (body.channel === "PHONE") {
        setPhoneFlow(true);
        setResendCooldown(60);
      } else {
        setMessage(body.message || t.success);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.error);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_URL}/auth/verify-reset-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, otp }),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.message || t.invalidOtp);
        router.push(`/reset-password?resetToken=${encodeURIComponent(body.resetToken)}`);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : t.invalidOtp);
      } finally {
        setLoading(false);
      }
    }

  async function resendOtp() {
      if (resendCooldown > 0 || loading) return;
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_URL}/auth/resend-reset-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier }),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.message || t.error);
        setOtp("");
        setResendCooldown(60);
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
          {error && (
            <p role="alert" className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {message && (
            <div aria-live="polite" className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-[#064E3B]">
              <p>{message}</p>
              <p className="mt-1 text-emerald-700">{t.successExpiryNote}</p>
            </div>
          )}
          {!phoneFlow && !message && <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="block text-sm font-semibold text-gray-700">
              {t.identifier}
              <input
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition-colors focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20"
              />
            </label>
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#064E3B] py-3 font-semibold text-white transition-colors duration-300 ease-in-out hover:bg-[#065F46] focus:outline-none focus:ring-2 focus:ring-[#064E3B] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
              {loading && <Spinner />}
              {loading ? t.submitting : t.submit}
            </button>
          </form>}
          {phoneFlow && <form onSubmit={verifyOtp} className="mt-6 space-y-5">
            <p className="text-sm text-gray-600">{t.otpDescription}</p>
            <label className="block text-sm font-semibold text-gray-700">
              {t.otp}
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                pattern="\d{6}"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-xl tracking-[0.5em] text-gray-900 outline-none transition-colors focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20"
              />
            </label>
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#064E3B] py-3 font-semibold text-white transition-colors duration-300 ease-in-out hover:bg-[#065F46] focus:outline-none focus:ring-2 focus:ring-[#064E3B] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
              {loading && <Spinner />}
              {loading ? t.verifying : t.verify}
            </button>
            <button type="button" onClick={resendOtp} disabled={loading || resendCooldown > 0} className="w-full text-sm font-semibold text-[#064E3B] hover:text-[#065F46] hover:underline disabled:text-gray-400 disabled:no-underline">
              {resendCooldown > 0 ? `${t.resend} (${resendCooldown}s)` : t.resend}
            </button>
          </form>}
          <Link href="/login" className="mt-6 block text-center text-sm font-semibold text-[#064E3B] hover:text-[#065F46] hover:underline">{t.backToLogin}</Link>
        </div>
      </div>
    </main>
  );
}
