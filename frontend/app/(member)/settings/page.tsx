
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import { useLanguage } from "@/lib/context/LanguageContext";
import { memberSettingsTranslations } from "@/constants/translations/member-settings";
import { API_URL } from "@/lib/utils/api";

interface TelecomOperator {
  operator_id: number;
  operator_name: string;
}

interface Bank {
  bank_id: number;
  bank_name: string;
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 " +
  "text-gray-900 outline-none transition " +
  "focus:border-blue-700 focus:ring-2 focus:ring-blue-200";

function useAuthHeaders() {
  const router = useRouter();

  return () => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return null;
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };
}

// =====================================================
// Change Password
// =====================================================

function ChangePasswordSection() {
  const getAuthHeaders = useAuthHeaders();
  const { language } = useLanguage();
  const t = memberSettingsTranslations[language];

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.newPassword !== form.confirmNewPassword) {
      setError(t.newPasswordsDontMatch);
      return;
    }

    if (form.newPassword.length < 8) {
      setError(t.newPasswordTooShort);
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/members/me/password`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            currentPassword: form.currentPassword,
            newPassword: form.newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.changePasswordErrorFallback);
      }

      setSuccess(t.changePasswordSuccess);
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t.genericErrorFallback
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

      <p className="text-lg font-bold text-gray-900">{t.changePasswordTitle}</p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-lg bg-blue-100 px-4 py-3 text-sm text-blue-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">

        <div>
          <label
            htmlFor="currentPassword"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            {t.currentPassword}
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            value={form.currentPassword}
            onChange={handleChange}
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            {t.newPassword}
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            value={form.newPassword}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={8}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="confirmNewPassword"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            {t.confirmNewPassword}
          </label>
          <input
            id="confirmNewPassword"
            name="confirmNewPassword"
            type="password"
            value={form.confirmNewPassword}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={8}
            required
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-700 px-6 py-3 font-semibold
          text-white transition hover:bg-blue-800
          disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t.saving : t.changePasswordButton}
        </button>

      </form>

    </div>
  );
}

// =====================================================
// Add Phone Number — an income source for the wallet
// (mobile money). The registration number can be re-entered here too;
// the backend treats that as already-linked instead of an error.
// =====================================================

function AddPhoneNumberSection() {
  const getAuthHeaders = useAuthHeaders();
  const { language } = useLanguage();
  const t = memberSettingsTranslations[language];

  const [operators, setOperators] = useState<TelecomOperator[]>([]);
  const [form, setForm] = useState({ operatorId: "", phoneNumber: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOperators = async () => {
      try {
        const response = await fetch(
          `${API_URL}/members/telecom-operators`
        );
        if (response.ok) setOperators(await response.json());
      } catch {
        // Options list is a nice-to-have here; the form still submits.
      }
    };
    loadOperators();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/members/phone-numbers`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            operatorId: Number(form.operatorId),
            phoneNumber: form.phoneNumber,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.addPhoneErrorFallback);
      }

      setSuccess(t.addPhoneSuccessTemplate.replace("{phoneNumber}", data.phoneNumber));
      setForm({ operatorId: "", phoneNumber: "" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t.genericErrorFallback
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

      <p className="text-lg font-bold text-gray-900">{t.addPhoneTitle}</p>
      <p className="mt-1 text-sm text-gray-500">
        {t.addPhoneDescription}
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-lg bg-blue-100 px-4 py-3 text-sm text-blue-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">

        <div>
          <label
            htmlFor="operatorId"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            {t.network}
          </label>
          <select
            id="operatorId"
            name="operatorId"
            value={form.operatorId}
            onChange={handleChange}
            required
            className={inputClass}
          >
            <option value="" disabled>
              {t.selectNetwork}
            </option>
            {operators.map((operator) => (
              <option key={operator.operator_id} value={operator.operator_id}>
                {operator.operator_name}
              </option>
            ))}
          </select>
        </div>

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
            value={form.phoneNumber}
            onChange={handleChange}
            placeholder={t.phoneNumberPlaceholder}
            required
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-700 px-6 py-3 font-semibold
          text-white transition hover:bg-blue-800
          disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t.adding : t.addPhoneButton}
        </button>

      </form>

    </div>
  );
}

// =====================================================
// Add Bank Account — another income source for the wallet.
// =====================================================

function AddBankAccountSection() {
  const getAuthHeaders = useAuthHeaders();
  const { language } = useLanguage();
  const t = memberSettingsTranslations[language];

  const [banks, setBanks] = useState<Bank[]>([]);
  const [form, setForm] = useState({
    bankId: "",
    accountNumber: "",
    accountType: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadBanks = async () => {
      try {
        const response = await fetch(`${API_URL}/members/banks`);
        if (response.ok) setBanks(await response.json());
      } catch {
        // Options list is a nice-to-have here; the form still submits.
      }
    };
    loadBanks();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/members/bank-accounts`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            bankId: Number(form.bankId),
            accountNumber: form.accountNumber,
            accountType: form.accountType,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.addBankErrorFallback);
      }

      setSuccess(t.addBankSuccessTemplate.replace("{accountNumber}", data.accountNumber));
      setForm({ bankId: "", accountNumber: "", accountType: "" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t.genericErrorFallback
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

      <p className="text-lg font-bold text-gray-900">{t.addBankTitle}</p>
      <p className="mt-1 text-sm text-gray-500">
        {t.addBankDescription}
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-lg bg-blue-100 px-4 py-3 text-sm text-blue-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">

        <div>
          <label
            htmlFor="bankId"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            {t.bank}
          </label>
          <select
            id="bankId"
            name="bankId"
            value={form.bankId}
            onChange={handleChange}
            required
            className={inputClass}
          >
            <option value="" disabled>
              {t.selectBank}
            </option>
            {banks.map((bank) => (
              <option key={bank.bank_id} value={bank.bank_id}>
                {bank.bank_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="accountNumber"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            {t.accountNumber}
          </label>
          <input
            id="accountNumber"
            name="accountNumber"
            type="text"
            value={form.accountNumber}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="accountType"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            {t.accountType}
          </label>
          <select
            id="accountType"
            name="accountType"
            value={form.accountType}
            onChange={handleChange}
            required
            className={inputClass}
          >
            <option value="" disabled>
              {t.selectAccountType}
            </option>
            <option value="Savings">{t.savings}</option>
            <option value="Current">{t.current}</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-700 px-6 py-3 font-semibold
          text-white transition hover:bg-blue-800
          disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t.adding : t.addBankButton}
        </button>

      </form>

    </div>
  );
}

// =====================================================
// Automatic Micro-Savings consent — off by request only; every member
// starts opted in, matching the backend default (absence of a
// member_saving_consents row means consented).
// =====================================================

function SavingConsentSection() {
  const getAuthHeaders = useAuthHeaders();
  const { language } = useLanguage();
  const t = memberSettingsTranslations[language];

  const [consented, setConsented] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const headers = getAuthHeaders();
    if (!headers) return;

    fetch(`${API_URL}/members/saving-consent`, { headers })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) setConsented(data.consented);
      })
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;

    const nextValue = !consented;
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/members/saving-consent`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ consented: nextValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.savingConsentUpdateErrorFallback);
      }

      setConsented(nextValue);
      setSuccess(t.savingConsentUpdateSuccess);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericErrorFallback);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
      <p className="text-lg font-bold text-gray-900">{t.savingConsentTitle}</p>
      <p className="mt-2 text-sm text-gray-600">{t.savingConsentDescription}</p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-lg bg-blue-100 px-4 py-3 text-sm text-blue-700">
          {success}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-gray-700">
          {consented ? t.savingConsentOn : t.savingConsentOff}
        </span>

        <button
          type="button"
          role="switch"
          aria-checked={consented}
          disabled={!loaded || saving}
          onClick={handleToggle}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ease-in-out disabled:opacity-60 ${
            consented ? "bg-[#064E3B]" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300 ease-in-out ${
              consented ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { language } = useLanguage();
  const t = memberSettingsTranslations[language];

  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-2xl mx-auto">

        <Link
          href="/profile"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← {t.backToProfile}
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          {t.title}
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          {t.description}
        </p>

        <div className="mt-8 space-y-6">
          <SavingConsentSection />
          <ChangePasswordSection />
          <AddPhoneNumberSection />
          <AddBankAccountSection />
        </div>

      </div>

    </div>
  );
}
