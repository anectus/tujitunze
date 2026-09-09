
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getAccessToken,
  MEMBERSHIP_JUST_COMPLETED_STORAGE_KEY,
} from "@/lib/utils/permissions";
import {
  detectTelecomOperator,
  type TelecomOperatorLookup,
} from "@/lib/utils/formatPhone";
import { useLanguage } from "@/lib/context/LanguageContext";
import { mobileMoneyFormTranslations } from "@/constants/translations/member-onboarding";
import { API_URL } from "@/lib/utils/api";
import FormField from "@/components/auth/FormField";
import InfoTooltip from "@/components/common/InfoTooltip";
import { PhoneIcon } from "@/components/common/SidebarIcons";

interface Bank {
  bank_id: number;
  bank_name: string;
}

interface Region {
  region_id: number;
  region_name: string;
  area_type: string;
}

interface District {
  district_id: number;
  district_name: string;
  region_id: number;
}

interface MobileMoneyAccountEntry {
  phoneNumber: string;
  accountNumber: string;
}

interface BankAccountEntry {
  bankId: string;
  accountNumber: string;
  accountType: string;
}

// Official logo files, supplied directly by the project owner into
// frontend/public/logos/ — not sourced or embedded by generating them
// here, since these are each operator's real trademarked artwork.
const OPERATOR_LOGOS: Record<string, string> = {
  Vodacom: "/logos/vodacom.jpeg",
  Airtel: "/logos/airtel.png",
  Halotel: "/logos/halotel.jpeg",
  TTCL: "/logos/ttcl.png",
  "Yas Money": "/logos/yas-money.jpeg",
};

const emptyEntry: MobileMoneyAccountEntry = {
  phoneNumber: "",
  accountNumber: "",
};

// Same visual/accessibility contract as FormField (components/auth/
// FormField.tsx — label, error styling, aria-invalid/aria-describedby)
// for a <select>, which that component doesn't render.
function FormSelectField({
  id,
  label,
  optionalLabel,
  value,
  onChange,
  onBlur,
  required,
  disabled,
  error,
  children,
}: {
  id: string;
  label: string;
  optionalLabel?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  const messageId = `${id}-message`;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-gray-700"
      >
        {label}
        {optionalLabel && (
          <span className="ml-2 text-xs font-normal text-gray-500">
            {optionalLabel}
          </span>
        )}
      </label>

      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? messageId : undefined}
        className={`w-full rounded-lg border px-4 py-3 text-gray-900 outline-none
        transition disabled:cursor-not-allowed disabled:bg-gray-50
        disabled:text-gray-400 ${
          error
            ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
            : "border-gray-300 focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20"
        }`}
      >
        {children}
      </select>

      {error && (
        <p id={messageId} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div className="mb-8">
      <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-gray-600">
        <span>{label}</span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-emerald-600 transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function MobileMoneyAccountForm() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = mobileMoneyFormTranslations[language];

  const [banks, setBanks] = useState<Bank[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [operators, setOperators] = useState<TelecomOperatorLookup[]>([]);

  const [profile, setProfile] = useState({
    gender: "",
    dateOfBirth: "",
    region: "",
    district: "",
  });

  // Which required fields have been interacted with yet — gates the
  // real-time red-border/error-text treatment so a freshly-loaded form
  // doesn't open already showing every required field as invalid.
  const [touched, setTouched] = useState({
    gender: false,
    region: false,
    phone: false,
  });

  // The first mobile money account is required (the whole point of this
  // page); each further one only appears once the entry before it is
  // complete, so accounts are filled one at a time rather than all at once.
  const [accounts, setAccounts] = useState<MobileMoneyAccountEntry[]>([
    { ...emptyEntry },
  ]);

  // Bank accounts are entirely optional — none are shown until the user
  // chooses to add one.
  const [bankAccounts, setBankAccounts] = useState<BankAccountEntry[]>([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [banksResponse, regionsResponse, operatorsResponse] =
          await Promise.all([
            fetch(`${API_URL}/members/banks`),
            fetch(`${API_URL}/members/regions`),
            fetch(`${API_URL}/members/telecom-operators`),
          ]);

        if (banksResponse.ok) {
          setBanks(await banksResponse.json());
        }

        if (regionsResponse.ok) {
          setRegions(await regionsResponse.json());
        }

        if (operatorsResponse.ok) {
          setOperators(await operatorsResponse.json());
        }
      } catch {
        setError(t.lookupErrorFallback);
      }
    };

    loadLookups();
  }, [t.lookupErrorFallback]);

  // The district list depends on the selected region, so it's fetched
  // fresh each time the region changes rather than loaded upfront.
  useEffect(() => {
    const selectedRegion = regions.find(
      (region) => region.region_name === profile.region
    );

    if (!selectedRegion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale districts when the region no longer matches one we know, not a value derivable during render
      setDistricts([]);
      return;
    }

    fetch(
      `${API_URL}/members/districts?regionId=${selectedRegion.region_id}`
    )
      .then((response) => (response.ok ? response.json() : []))
      .then((data: District[]) => setDistricts(data))
      .catch(() => setDistricts([]));
  }, [profile.region, regions]);

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
      // A district only belongs to one region, so switching regions
      // clears whatever district was previously selected.
      ...(name === "region" ? { district: "" } : {}),
    }));

    setError("");
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((previous) => ({ ...previous, [field]: true }));
  };

  // =====================================================
  // Mobile money accounts
  // =====================================================

  const canAddAccount = accounts.every(
    (entry) => entry.phoneNumber.trim().length > 0
  );

  const addAccountEntry = () => {
    setAccounts((previous) => [...previous, { ...emptyEntry }]);
    setError("");
  };

  const removeAccountEntry = (index: number) => {
    setAccounts((previous) => previous.filter((_, i) => i !== index));
  };

  const updateAccountEntry = (
    index: number,
    field: keyof MobileMoneyAccountEntry,
    value: string
  ) => {
    setAccounts((previous) =>
      previous.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    );

    setError("");
  };

  // =====================================================
  // Bank accounts — optional. Each entry reveals "Account Type" only
  // after its account number is filled, and "+ Add another" only
  // appears once every prior entry (bank + number + type) is complete.
  // =====================================================

  const canAddBankAccount = bankAccounts.every(
    (entry) =>
      entry.bankId && entry.accountNumber.trim().length > 0 && entry.accountType
  );

  const addBankAccountEntry = () => {
    setBankAccounts((previous) => [
      ...previous,
      { bankId: "", accountNumber: "", accountType: "" },
    ]);
    setError("");
  };

  const removeBankAccountEntry = (index: number) => {
    setBankAccounts((previous) => previous.filter((_, i) => i !== index));
  };

  const updateBankAccountEntry = (
    index: number,
    field: keyof BankAccountEntry,
    value: string
  ) => {
    setBankAccounts((previous) =>
      previous.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    );

    setError("");
  };

  // =====================================================
  // Real-time validation + progress — mirrors what the backend actually
  // requires (members.service.ts's isMembershipComplete: gender, region,
  // an active phone number) plus the optional bank account, so a member
  // watching this bar fill up sees the same definition of "complete"
  // the dashboard's redirect gate uses.
  // =====================================================

  const genderError =
    touched.gender && !profile.gender ? t.genderRequiredError : undefined;
  const regionError =
    touched.region && !profile.region ? t.regionRequiredError : undefined;
  const firstPhoneError =
    touched.phone && !accounts[0].phoneNumber.trim()
      ? t.phoneRequiredError
      : undefined;

  const hasBankAccount = bankAccounts.some(
    (entry) =>
      entry.bankId && entry.accountNumber.trim().length > 0 && entry.accountType
  );

  const progressPercent =
    ([
      !!profile.gender,
      !!profile.region,
      accounts.some((entry) => entry.phoneNumber.trim().length > 0),
      hasBankAccount,
    ].filter(Boolean).length /
      4) *
    100;

  const progressLabel =
    progressPercent >= 100
      ? t.progressComplete
      : t.progressLabelTemplate.replace(
          "{percent}",
          String(Math.round(progressPercent))
        ) + (progressPercent >= 75 ? t.progressBankHint : "");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setTouched({ gender: true, region: true, phone: true });
    setError("");

    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      setLoading(true);

      // 1. Profile details
      const profileResponse = await fetch(
        `${API_URL}/members/me`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({
            gender: profile.gender,
            dateOfBirth: profile.dateOfBirth || undefined,
            region: profile.region,
            district: profile.district || undefined,
          }),
        }
      );

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(
          profileData.message || t.profileSaveErrorFallback
        );
      }

      // 2. Mobile money accounts — linked one at a time, in the order
      // the user filled them in.
      for (let index = 0; index < accounts.length; index += 1) {
        const entry = accounts[index];

        const response = await fetch(
          `${API_URL}/members/phone-numbers`,
          {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              phoneNumber: entry.phoneNumber,
              accountNumber: entry.accountNumber || undefined,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            accounts.length > 1
              ? t.mobileMoneyMultiErrorTemplate
                  .replace("{n}", String(index + 1))
                  .replace("{message}", data.message || t.mobileMoneyLinkErrorFallback)
              : data.message || t.mobileMoneySingleLinkErrorFallback
          );
        }
      }

      // 3. Bank accounts — optional, also linked one at a time.
      for (let index = 0; index < bankAccounts.length; index += 1) {
        const entry = bankAccounts[index];

        const response = await fetch(
          `${API_URL}/members/bank-accounts`,
          {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              bankId: Number(entry.bankId),
              accountNumber: entry.accountNumber,
              accountType: entry.accountType,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            bankAccounts.length > 1
              ? t.bankMultiErrorTemplate
                  .replace("{n}", String(index + 1))
                  .replace("{message}", data.message || t.bankLinkErrorFallback)
              : data.message || t.bankLinkErrorFallback
          );
        }
      }

      setShowSuccessModal(true);

      try {
        sessionStorage.setItem(MEMBERSHIP_JUST_COMPLETED_STORAGE_KEY, "1");
      } catch {
        // Same as elsewhere in this app — sessionStorage can throw in a
        // locked-down browsing context; the Settings-page banner just
        // won't show, no functional loss.
      }

      setTimeout(() => {
        router.push("/dashboard?welcome=1");
      }, 2000);
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
    <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-white px-4 py-12 sm:px-6">

      <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-xl sm:p-10">

        <div className="mb-8 text-center">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 [animation:fade-in_0.6s_ease-out_forwards] motion-reduce:[animation:none]">
            <PhoneIcon className="h-8 w-8 text-[#064E3B]" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            {t.title}
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            {t.subtitle}
          </p>

        </div>

        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0"
          >
            <circle cx="12" cy="12" r="8.25" />
            <line x1="12" y1="10.5" x2="12" y2="16" />
            <circle cx="12" cy="7.75" r="0.75" fill="currentColor" stroke="none" />
          </svg>
          <p>{t.incompleteBanner}</p>
        </div>

        <ProgressBar percent={progressPercent} label={progressLabel} />

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 [animation:fade-in_0.3s_ease-out_forwards] motion-reduce:[animation:none]"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8" noValidate>

          {/* Personal Information */}
          <div className="space-y-6">
            <h2 className="mb-0 text-lg font-semibold text-gray-900">
              {t.sectionPersonalInfo}
            </h2>

            {/* Gender */}
            <FormSelectField
              id="gender"
              label={t.gender}
              value={profile.gender}
              onChange={handleProfileChange}
              onBlur={() => handleBlur("gender")}
              required
              error={genderError}
            >
              <option value="" disabled>
                {t.selectGender}
              </option>
              <option value="Male">{t.male}</option>
              <option value="Female">{t.female}</option>
            </FormSelectField>

            {/* Date of Birth - Optional */}
            <FormField
              id="dateOfBirth"
              name="dateOfBirth"
              label={t.dateOfBirth}
              optionalLabel={t.optional}
              type="date"
              value={profile.dateOfBirth}
              onChange={handleProfileChange}
              autoComplete="bday"
            />
          </div>

          {/* Location Information */}
          <div className="space-y-6 border-t border-gray-100 pt-8">
            <h2 className="mb-0 text-lg font-semibold text-gray-900">
              {t.sectionLocationInfo}
            </h2>

            {/* Region */}
            <FormSelectField
              id="region"
              label={t.region}
              value={profile.region}
              onChange={handleProfileChange}
              onBlur={() => handleBlur("region")}
              required
              error={regionError}
            >
              <option value="" disabled>
                {t.selectRegion}
              </option>

              {regions.map((region) => (
                <option key={region.region_id} value={region.region_name}>
                  {region.region_name}
                </option>
              ))}
            </FormSelectField>

            {/* District - Optional */}
            <FormSelectField
              id="district"
              label={t.district}
              optionalLabel={t.optional}
              value={profile.district}
              onChange={handleProfileChange}
              disabled={!profile.region}
            >
              <option value="">
                {profile.region ? t.selectDistrict : t.selectRegionFirst}
              </option>

              {districts.map((district) => (
                <option
                  key={district.district_id}
                  value={district.district_name}
                >
                  {district.district_name}
                </option>
              ))}
            </FormSelectField>
          </div>

          {/* Mobile Money Accounts */}
          <div className="space-y-6 border-t border-gray-100 pt-8">
          <h2 className="mb-0 text-lg font-semibold text-gray-900">
            {t.sectionMobileMoney}
          </h2>

          {accounts.map((entry, index) => {
            const detected = detectTelecomOperator(
              entry.phoneNumber,
              operators
            );
            const logoSrc = detected
              ? OPERATOR_LOGOS[detected.operator_name]
              : undefined;

            return (
              <div
                key={index}
                className={
                  accounts.length > 1
                    ? "rounded-lg border border-gray-200 p-4 space-y-6"
                    : "space-y-6"
                }
              >
                {accounts.length > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">
                      {t.mobileMoneyAccountTemplate.replace("{n}", String(index + 1))}
                    </p>

                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeAccountEntry(index)}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        {t.remove}
                      </button>
                    )}
                  </div>
                )}

                {/* Phone Number */}
                <FormField
                  id={`phoneNumber-${index}`}
                  name={`phoneNumber-${index}`}
                  label={t.phoneNumber}
                  type="tel"
                  value={entry.phoneNumber}
                  onChange={(e) =>
                    updateAccountEntry(index, "phoneNumber", e.target.value)
                  }
                  onBlur={index === 0 ? () => handleBlur("phone") : undefined}
                  placeholder={t.phoneNumberPlaceholder}
                  autoComplete="tel"
                  helpText={t.networkDetectedHelp}
                  error={index === 0 ? firstPhoneError : undefined}
                  trailingWidthClass="pr-32"
                  trailing={
                    detected ? (
                      <span className="pointer-events-none flex items-center gap-1.5 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-2.5 text-xs font-semibold text-gray-700 shadow-sm">
                        {logoSrc && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={logoSrc}
                            alt=""
                            width={20}
                            height={20}
                            loading="lazy"
                            className="h-5 w-5 rounded-full object-cover"
                          />
                        )}
                        {detected.operator_name}
                      </span>
                    ) : undefined
                  }
                />

                {/* Account Number - Optional, only once the number above is filled */}
                {entry.phoneNumber.trim().length > 0 && (
                  <FormField
                    id={`accountNumber-${index}`}
                    name={`accountNumber-${index}`}
                    label={t.accountNumber}
                    optionalLabel={t.optional}
                    type="text"
                    value={entry.accountNumber}
                    onChange={(e) =>
                      updateAccountEntry(index, "accountNumber", e.target.value)
                    }
                    placeholder={t.accountNumberPlaceholder}
                  />
                )}
              </div>
            );
          })}

          {canAddAccount && (
            <button
              type="button"
              onClick={addAccountEntry}
              className="text-sm font-semibold text-[#064E3B] hover:text-emerald-800"
            >
              {t.addAnotherMobileMoneyAccount}
            </button>
          )}
          </div>

          {/* Bank Accounts - Optional */}
          <div className="space-y-4 border-t border-gray-100 pt-8">
            <h2 className="mb-0 text-lg font-semibold text-gray-900">
              {t.sectionBankAccounts}
            </h2>

            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-gray-700">
                {t.bankAccount}
                <span className="ml-2 text-xs font-normal text-gray-500">
                  {t.optional}
                </span>
              </p>
              <InfoTooltip text={t.bankAccountTooltip} />
            </div>

            {bankAccounts.map((entry, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">
                    {t.bankAccountTemplate.replace("{n}", String(index + 1))}
                  </p>

                  <button
                    type="button"
                    onClick={() => removeBankAccountEntry(index)}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    {t.remove}
                  </button>
                </div>

                <FormSelectField
                  id={`bank-${index}-bank`}
                  label={t.bank}
                  value={entry.bankId}
                  onChange={(e) =>
                    updateBankAccountEntry(index, "bankId", e.target.value)
                  }
                  required
                >
                  <option value="" disabled>
                    {t.selectYourBank}
                  </option>

                  {banks.map((bank) => (
                    <option key={bank.bank_id} value={bank.bank_id}>
                      {bank.bank_name}
                    </option>
                  ))}
                </FormSelectField>

                <FormField
                  id={`bank-${index}-account-number`}
                  name={`bank-${index}-account-number`}
                  label={t.accountNumber}
                  type="text"
                  value={entry.accountNumber}
                  onChange={(e) =>
                    updateBankAccountEntry(
                      index,
                      "accountNumber",
                      e.target.value
                    )
                  }
                  placeholder={t.bankAccountNumberPlaceholder}
                />

                {entry.accountNumber.trim().length > 0 && (
                  <FormSelectField
                    id={`bank-${index}-account-type`}
                    label={t.accountType}
                    value={entry.accountType}
                    onChange={(e) =>
                      updateBankAccountEntry(
                        index,
                        "accountType",
                        e.target.value
                      )
                    }
                    required
                  >
                    <option value="" disabled>
                      {t.selectAccountType}
                    </option>
                    <option value="Savings">{t.savings}</option>
                    <option value="Current">{t.current}</option>
                  </FormSelectField>
                )}
              </div>
            ))}

            {canAddBankAccount && (
              <button
                type="button"
                onClick={addBankAccountEntry}
                className="text-sm font-semibold text-[#064E3B] hover:text-emerald-800"
              >
                {bankAccounts.length > 0 ? t.addAnotherBankAccount : t.addABankAccount}
              </button>
            )}
          </div>

          {/* Sticky on mobile so the primary action is always reachable
              without scrolling back down a long form; reverts to normal
              in-flow positioning from sm: up. */}
          <div className="sticky bottom-0 -mx-6 border-t border-gray-100 bg-white/95 px-6 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-6 py-3 text-lg
              font-semibold text-white transition-transform duration-200
              hover:scale-105 hover:bg-emerald-700
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-offset-2 focus-visible:ring-emerald-500
              disabled:cursor-not-allowed disabled:opacity-60
              disabled:hover:scale-100 motion-reduce:hover:scale-100"
            >
              {loading ? t.saving : t.saveAndContinue}
            </button>
          </div>

        </form>

      </div>

      {showSuccessModal && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="membership-success-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4 [animation:fade-in_0.2s_ease-out_forwards] motion-reduce:[animation:none]"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl">
            <p className="text-4xl" aria-hidden="true">🎉</p>
            <h2
              id="membership-success-title"
              className="mt-3 text-xl font-bold text-gray-900"
            >
              {t.successModalTitle}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t.successModalBody}
            </p>
          </div>
        </div>
      )}

    </section>
  );
}
