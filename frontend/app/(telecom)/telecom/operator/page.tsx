"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { useLanguage } from "@/lib/context/LanguageContext";
import { commonTranslations } from "@/constants/translations/common";
import { telecomOperatorTranslations } from "@/constants/translations/telecom-operator";
import { API_URL } from "@/lib/utils/api";

type ConnectionTestState =
  | "connected"
  | "connection_failed"
  | "credentials_missing"
  | "integration_not_configured"
  | "timeout"
  | "authentication_failed";

interface OperatorProfile {
  operatorId: number;
  operatorName: string;
  countryCode: string;
  apiEndpoint: string | null;
  status: string;
  contactPhone: string | null;
  contactEmail: string | null;
  prefixes: string[];
  apiKey: { hasKey: boolean; preview: string | null; generatedAt: string | null };
  webhook: { hasWebhook: boolean; url: string | null; secretGeneratedAt: string | null };
}

const CONNECTION_TEST_STYLES: Record<ConnectionTestState, string> = {
  connected: "bg-green-50 text-green-800 border border-green-200",
  connection_failed: "bg-red-50 text-red-800 border border-red-200",
  authentication_failed: "bg-red-50 text-red-800 border border-red-200",
  credentials_missing: "bg-amber-50 text-amber-800 border border-amber-200",
  timeout: "bg-amber-50 text-amber-800 border border-amber-200",
  integration_not_configured: "bg-gray-50 text-gray-600 border border-gray-200",
};

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

export default function TelecomOperatorPage() {
  const getAuthHeaders = useAuthHeaders();
  const { language } = useLanguage();
  const t = telecomOperatorTranslations[language];
  const common = commonTranslations[language];

  const [profile, setProfile] = useState<OperatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [savingContact, setSavingContact] = useState(false);

  const [webhookUrl, setWebhookUrl] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<{ label: string; value: string } | null>(null);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    state?: ConnectionTestState;
    provider?: string;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      const headers = getAuthHeaders();
      if (!headers) return;

      try {
        const response = await fetch(`${API_URL}/telecom/operator`, { headers });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || t.loadError);
        }

        setProfile(data);
        setContactPhone(data.contactPhone || "");
        setContactEmail(data.contactEmail || "");
        setWebhookUrl(data.webhook.url || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : t.loadError);
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    if (!headers) return;

    setSavingContact(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/telecom/operator/contact`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ contactPhone, contactEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.updateContactError);
      }

      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.updateContactError);
    } finally {
      setSavingContact(false);
    }
  };

  const regenerateApiKey = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;

    setError("");
    setRevealedSecret(null);

    try {
      const response = await fetch(
        `${API_URL}/telecom/operator/api-key/regenerate`,
        { method: "POST", headers }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.regenerateKeyError);
      }

      setRevealedSecret({ label: t.newApiKeyLabel, value: data.apiKey });

      setProfile((current) =>
        current
          ? { ...current, apiKey: { hasKey: true, preview: data.preview, generatedAt: new Date().toISOString() } }
          : current
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t.regenerateKeyError);
    }
  };

  const saveWebhook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    if (!headers) return;

    setSavingWebhook(true);
    setError("");
    setRevealedSecret(null);

    try {
      const response = await fetch(`${API_URL}/telecom/operator/webhook`, {
        method: "POST",
        headers,
        body: JSON.stringify({ webhookUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.webhookError);
      }

      setRevealedSecret({ label: t.webhookSecretLabel, value: data.webhookSecret });

      setProfile((current) =>
        current
          ? {
              ...current,
              webhook: { hasWebhook: true, url: data.webhookUrl, secretGeneratedAt: new Date().toISOString() },
            }
          : current
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t.webhookError);
    } finally {
      setSavingWebhook(false);
    }
  };

  const testConnection = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`${API_URL}/telecom/operator/connection-test`, {
        method: "POST",
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        setTestResult({
          success: false,
          message: data.message || t.connectionTestFailed,
          state: data.state,
          provider: data.provider,
        });
        return;
      }

      setTestResult(data);
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : t.connectionTestFailed,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>

      <DashboardHeader title={t.headerTitle} />

      <div className="p-4 sm:p-8">

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {revealedSecret && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">{revealedSecret.label} {t.shownOnceSuffix}</p>
            <code className="mt-1 block break-all rounded bg-white px-3 py-2 text-xs text-gray-900">
              {revealedSecret.value}
            </code>
          </div>
        )}

        {loading ? (

          <p className="text-gray-500">{common.loading}</p>

        ) : profile ? (

          <div className="space-y-6">

            {/* Operator Information */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-gray-900">{profile.operatorName}</p>
                <StatusBadge domain="partner" status={profile.status} />
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">{t.countryCode}</dt>
                  <dd className="mt-1 text-gray-900">+{profile.countryCode}</dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">{t.prefixes}</dt>
                  <dd className="mt-1 text-gray-900">{profile.prefixes.join(", ") || t.none}</dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase text-gray-500">{t.apiEndpoint}</dt>
                  <dd className="mt-1 text-gray-900">{profile.apiEndpoint || t.notConfigured}</dd>
                </div>

              </dl>

            </div>

            {/* Contact Information */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <p className="text-lg font-bold text-gray-900">{t.contactInformationHeading}</p>

              <form onSubmit={saveContact} className="mt-4 grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">{t.contactPhone}</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder={t.contactPhonePlaceholder}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">{t.contactEmail}</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder={t.contactEmailPlaceholder}
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={savingContact}
                    className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white
                    transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingContact ? t.saving : t.saveContactInfo}
                  </button>
                </div>

              </form>

            </div>

            {/* API Credentials */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <p className="text-lg font-bold text-gray-900">{t.apiCredentialsHeading}</p>
              <p className="mt-1 text-sm text-gray-500">
                {t.apiCredentialsBody}
              </p>

              <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-700">
                  {profile.apiKey.hasKey
                    ? t.activeKeyLabel(profile.apiKey.preview ?? "")
                    : t.noKeyYet}
                </span>

                <button
                  type="button"
                  onClick={regenerateApiKey}
                  className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                >
                  {profile.apiKey.hasKey ? t.regenerate : t.generate}
                </button>
              </div>

            </div>

            {/* API Integration: Webhooks + Connection Testing */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <p className="text-lg font-bold text-gray-900">{t.apiIntegrationHeading}</p>

              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700">{t.webhookLabel}</p>

                <form onSubmit={saveWebhook} className="mt-2 flex flex-wrap gap-3">
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder={t.webhookPlaceholder}
                    className={`${inputClass} flex-1 min-w-[240px]`}
                    required
                  />
                  <button
                    type="submit"
                    disabled={savingWebhook}
                    className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white
                    transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingWebhook ? t.saving : profile.webhook.hasWebhook ? t.update : t.configure}
                  </button>
                </form>

                {profile.webhook.hasWebhook && (
                  <p className="mt-2 text-xs text-gray-500">
                    {t.webhookPointedAt(profile.webhook.url ?? "")}
                  </p>
                )}
              </div>

              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="text-sm font-semibold text-gray-700">{t.connectionTestingHeading}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {t.connectionTestingBody}
                </p>
                {profile.operatorName.toLowerCase() === "vodacom" && (
                  <p className="mt-1 text-xs text-gray-400">{t.vodacomTestHint}</p>
                )}

                <button
                  type="button"
                  onClick={testConnection}
                  disabled={testing}
                  className="mt-3 rounded-lg border border-gray-300 px-4 py-2 text-sm
                  font-semibold text-gray-700 transition hover:bg-gray-50
                  disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {testing ? t.testing : t.testConnection}
                </button>

                {testResult && (
                  <div
                    className={`mt-3 rounded-lg px-4 py-3 text-sm ${
                      CONNECTION_TEST_STYLES[testResult.state ?? (testResult.success ? "connected" : "connection_failed")]
                    }`}
                  >
                    <p className="font-semibold">
                      {testResult.success ? "✓" : "✗"}{" "}
                      {t.connectionTestStateLabels[
                        testResult.state ?? (testResult.success ? "connected" : "connection_failed")
                      ]}
                    </p>
                    <p className="mt-1 text-xs opacity-90">{testResult.message}</p>
                  </div>
                )}
              </div>

            </div>

            {/* Security Settings */}
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-gray-600">{t.securitySettingsHeading}</p>
              <p className="mt-2 text-sm text-gray-400">
                {t.securitySettingsBody}
              </p>
            </div>

          </div>

        ) : null}

      </div>

    </div>
  );
}
