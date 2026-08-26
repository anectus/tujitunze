"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/context/LanguageContext";
import { resetPasswordTranslations } from "@/constants/translations/auth";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

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
        <div className="mb-4 flex justify-end"><LanguageSwitcher /></div>
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
          <Link href="/login" className="text-2xl font-bold text-blue-700">Tujitunze</Link>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">{t.title}</h1>
          <p className="mt-2 text-sm text-gray-600">{t.description}</p>
          {error && <p className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>}
          {message && <p className="mt-6 rounded-lg bg-blue-100 px-4 py-3 text-sm text-blue-700">{message}</p>}
          {!message && <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="block text-sm font-semibold text-gray-700">{t.password}<input type="password" required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200" /></label>
            <label className="block text-sm font-semibold text-gray-700">{t.confirmPassword}<input type="password" required minLength={8} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200" /></label>
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-700 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{loading ? t.submitting : t.submit}</button>
          </form>}
          {message && <Link href="/login" className="mt-6 block text-center text-sm font-semibold text-blue-700">{t.backToLogin}</Link>}
        </div>
      </div>
    </main>
  );
}
