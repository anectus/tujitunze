
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Smartphone,
  Landmark,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { getAccessToken } from "@/lib/utils/permissions";
import { useLanguage } from "@/lib/context/LanguageContext";
import { memberSettingsTranslations } from "@/constants/translations/member-settings";
import { API_URL } from "@/lib/utils/api";
import PageContainer from "@/components/dashboard/PageContainer";
import Button from "@/components/common/Button";

interface TelecomOperator {
  operator_id: number;
  operator_name: string;
}

interface Bank {
  bank_id: number;
  bank_name: string;
}

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 " +
  "text-gray-900 outline-none transition " +
  "focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200";

const selectClass = `${inputClass} appearance-none pr-10`;

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
// Shared presentational pieces
// =====================================================

// Grouped panel — the "distinct panel with a clear heading" unit every
// settings group renders in. Subtly tinted (bg-gray-50) so it separates
// from the page background without the harder line a border-only card
// gives; inputs inside stay bg-white so they still pop against it.
function SettingsPanel({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#064E3B]">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

// A setting-level sub-heading, one size down from the panel's own
// heading — used when a panel holds more than one distinct control
// (Wallet Sources: phone + bank) so each keeps its own label.
function SubHeading({
  icon: Icon,
  title,
  description,
}: {
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      {Icon && (
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
      )}
      <div>
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
    </div>
  );
}

function Alert({
  variant,
  children,
}: {
  variant: "error" | "success";
  children: React.ReactNode;
}) {
  const Icon = variant === "error" ? AlertCircle : CheckCircle2;
  const styles =
    variant === "error"
      ? "border border-red-100 bg-red-50 text-red-700"
      : "border border-emerald-100 bg-emerald-50 text-emerald-700";

  return (
    <div className={`mt-4 flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${styles}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

function SelectField({
  id,
  name,
  label,
  value,
  onChange,
  required,
  children,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={selectClass}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
      </div>
    </div>
  );
}

function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete,
  minLength,
  required,
  hint,
  showLabel,
  hideLabel,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete: string;
  minLength?: number;
  required?: boolean;
  hint?: { text: string; met: boolean };
  showLabel: string;
  hideLabel: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <div className="relative">
        <Lock
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden
        />

        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          minLength={minLength}
          required={required}
          className={`${inputClass} pl-10 pr-10`}
        />

        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {hint && (
        <p
          className={`mt-1.5 flex items-center gap-1 text-xs ${
            hint.met ? "text-emerald-700" : "text-gray-400"
          }`}
        >
          {hint.met && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}
          {hint.text}
        </p>
      )}
    </div>
  );
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
    <div>
      <SubHeading icon={Lock} title={t.changePasswordTitle} />

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">

        <PasswordField
          id="currentPassword"
          name="currentPassword"
          label={t.currentPassword}
          value={form.currentPassword}
          onChange={handleChange}
          autoComplete="current-password"
          required
          showLabel={t.showPassword}
          hideLabel={t.hidePassword}
        />

        <PasswordField
          id="newPassword"
          name="newPassword"
          label={t.newPassword}
          value={form.newPassword}
          onChange={handleChange}
          autoComplete="new-password"
          minLength={8}
          required
          showLabel={t.showPassword}
          hideLabel={t.hidePassword}
          hint={{ text: t.passwordMinLengthHint, met: form.newPassword.length >= 8 }}
        />

        <PasswordField
          id="confirmNewPassword"
          name="confirmNewPassword"
          label={t.confirmNewPassword}
          value={form.confirmNewPassword}
          onChange={handleChange}
          autoComplete="new-password"
          minLength={8}
          required
          showLabel={t.showPassword}
          hideLabel={t.hidePassword}
          hint={
            form.confirmNewPassword.length > 0
              ? { text: t.passwordsMatchHint, met: form.confirmNewPassword === form.newPassword }
              : undefined
          }
        />

        <Button type="submit" disabled={loading} size="sm">
          {loading ? t.saving : t.changePasswordButton}
        </Button>

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
    <div>
      <SubHeading icon={Smartphone} title={t.addPhoneTitle} description={t.addPhoneDescription} />

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">

        <SelectField
          id="operatorId"
          name="operatorId"
          label={t.network}
          value={form.operatorId}
          onChange={handleChange}
          required
        >
          <option value="" disabled>
            {t.selectNetwork}
          </option>
          {operators.map((operator) => (
            <option key={operator.operator_id} value={operator.operator_id}>
              {operator.operator_name}
            </option>
          ))}
        </SelectField>

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

        <Button type="submit" disabled={loading} size="sm">
          {loading ? t.adding : t.addPhoneButton}
        </Button>

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
    <div>
      <SubHeading icon={Landmark} title={t.addBankTitle} description={t.addBankDescription} />

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">

        <SelectField
          id="bankId"
          name="bankId"
          label={t.bank}
          value={form.bankId}
          onChange={handleChange}
          required
        >
          <option value="" disabled>
            {t.selectBank}
          </option>
          {banks.map((bank) => (
            <option key={bank.bank_id} value={bank.bank_id}>
              {bank.bank_name}
            </option>
          ))}
        </SelectField>

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

        <SelectField
          id="accountType"
          name="accountType"
          label={t.accountType}
          value={form.accountType}
          onChange={handleChange}
          required
        >
          <option value="" disabled>
            {t.selectAccountType}
          </option>
          <option value="Savings">{t.savings}</option>
          <option value="Current">{t.current}</option>
        </SelectField>

        <Button type="submit" disabled={loading} size="sm">
          {loading ? t.adding : t.addBankButton}
        </Button>

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
    <div>
      <SubHeading title={t.savingConsentTitle} description={t.savingConsentDescription} />

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="mt-4 flex items-center justify-between gap-4 rounded-lg bg-white p-4">
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

// =====================================================
// Page shell — two tabs (User Settings / Security Settings), each
// holding its own set of grouped panels.
// =====================================================

type TabKey = "user" | "security";

function SettingsTabs({
  active,
  onChange,
  userLabel,
  securityLabel,
}: {
  active: TabKey;
  onChange: (key: TabKey) => void;
  userLabel: string;
  securityLabel: string;
}) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: "user", label: userLabel },
    { key: "security", label: securityLabel },
  ];

  return (
    <div role="tablist" className="mt-6 flex gap-6 border-b border-gray-200">
      {tabs.map((tab) => {
        const isActive = active === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={`relative pb-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 rounded-t ${
              isActive ? "text-[#064E3B]" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {isActive && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#064E3B]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function SettingsPage() {
  const { language } = useLanguage();
  const t = memberSettingsTranslations[language];
  const [activeTab, setActiveTab] = useState<TabKey>("user");

  return (
    <PageContainer backHref="/profile" backLabel={t.backToProfile}>

      <div className="mx-auto max-w-2xl">

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          {t.title}
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          {t.description}
        </p>

        <SettingsTabs
          active={activeTab}
          onChange={setActiveTab}
          userLabel={t.userSettingsTab}
          securityLabel={t.securitySettingsTab}
        />

        <div className="mt-8 space-y-6">

          {activeTab === "user" ? (

            <>
              <SettingsPanel
                icon={Sparkles}
                title={t.microSavingsGroupTitle}
                description={t.microSavingsGroupDescription}
              >
                <SavingConsentSection />
              </SettingsPanel>

              <SettingsPanel
                icon={Phone}
                title={t.walletSourcesGroupTitle}
                description={t.walletSourcesGroupDescription}
              >
                <div className="space-y-8">
                  <AddPhoneNumberSection />
                  <div className="border-t border-gray-200 pt-8">
                    <AddBankAccountSection />
                  </div>
                </div>
              </SettingsPanel>
            </>

          ) : (

            <SettingsPanel
              icon={ShieldCheck}
              title={t.accountSecurityGroupTitle}
              description={t.accountSecurityGroupDescription}
            >
              <ChangePasswordSection />
            </SettingsPanel>

          )}

        </div>

      </div>

    </PageContainer>
  );
}
