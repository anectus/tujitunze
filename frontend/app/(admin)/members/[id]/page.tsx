
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import StatusBadge from "@/components/common/StatusBadge";
import { useLanguage } from "@/lib/context/LanguageContext";
import { adminMemberDetailTranslations } from "@/constants/translations/admin-member-detail";
import { commonTranslations } from "@/constants/translations/common";
import { getStatusLabel } from "@/constants/translations/statuses";
import { API_URL } from "@/lib/utils/api";

interface TelecomOperator {
  operator_id: number;
  operator_name: string;
}

interface PhoneNumber {
  phoneId: number;
  phoneNumber: string;
  operatorId: number;
  accountNumber: string | null;
  isPrimary: boolean;
  phoneStatus: string;
}

interface AdminMemberDetail {
  userId: number;
  firstName: string;
  secondName: string | null;
  surname: string;
  email: string | null;
  nidaNumber: string;
  gender: string | null;
  dateOfBirth: string | null;
  address: string | null;
  region: string | null;
  district: string | null;
  memberStatus: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  phoneNumbers: PhoneNumber[];
}

const STATUS_OPTIONS = ["Pending", "Active", "Suspended", "Inactive"];

export default function AdminMemberDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { language } = useLanguage();
  const t = adminMemberDetailTranslations[language];
  const common = commonTranslations[language];

  const [member, setMember] = useState<AdminMemberDetail | null>(null);
  const [operators, setOperators] = useState<TelecomOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const loadMember = async () => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const [memberResponse, operatorsResponse] = await Promise.all([
          fetch(`${API_URL}/admin/members/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/members/telecom-operators`),
        ]);

        if (memberResponse.status === 401 || memberResponse.status === 403) {
          router.push("/login");
          return;
        }

        const memberData = await memberResponse.json();

        if (!memberResponse.ok) {
          throw new Error(memberData.message || t.loadError);
        }

        setMember(memberData);

        if (operatorsResponse.ok) {
          setOperators(await operatorsResponse.json());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t.loadError);
      } finally {
        setLoading(false);
      }
    };

    loadMember();
  }, [params.id, router, t.loadError]);

  const handleStatusChange = async (status: string) => {
    const token = getAccessToken();
    if (!token || !member) return;

    setUpdatingStatus(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/admin/members/${member.userId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.updateStatusError);
      }

      setMember((previous) =>
        previous ? { ...previous, memberStatus: status } : previous
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t.updateStatusError);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const operatorName = (operatorId: number) =>
    operators.find((operator) => operator.operator_id === operatorId)
      ?.operator_name ?? t.unknownNetwork;

  const fullName = member
    ? [member.firstName, member.secondName, member.surname]
        .filter(Boolean)
        .join(" ")
    : "";

  const initials = member
    ? `${member.firstName[0] ?? ""}${member.surname[0] ?? ""}`.toUpperCase()
    : "";

  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-2xl mx-auto">

        <Link
          href="/admin/members"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← {t.backToMembers}
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          {t.title}
        </h1>

        {loading && (
          <p className="mt-8 text-gray-500">{t.loading}</p>
        )}

        {error && (
          <div className="mt-8 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {member && (
          <div className="mt-8 space-y-6">

            {/* Identity card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <div className="flex items-center justify-between gap-4">

                <div className="flex items-center gap-4">

                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                    {initials}
                  </div>

                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {fullName}
                    </p>

                    <div className="mt-1">
                      <StatusBadge domain="member" status={member.memberStatus} />
                    </div>
                  </div>

                </div>

                <select
                  value={member.memberStatus}
                  disabled={updatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="
                    rounded-lg
                    border
                    border-gray-300
                    px-3
                    py-2
                    text-sm
                    text-gray-900
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-600
                    focus:border-blue-600
                    disabled:opacity-60
                  "
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(language, "member", status)}
                    </option>
                  ))}
                </select>

              </div>

              <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    {t.nidaNumber}
                  </dt>
                  <dd className="mt-1 text-gray-900">{member.nidaNumber}</dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    {t.email}
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {member.email || common.notProvided}
                    {member.email && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({member.emailVerified ? t.verified : t.unverified})
                      </span>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    {t.gender}
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {member.gender || common.notProvided}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    {t.dateOfBirth}
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {member.dateOfBirth || common.notProvided}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    {t.region}
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {member.region || common.notProvided}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    {t.district}
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {member.district || common.notProvided}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    {t.address}
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {member.address || common.notProvided}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    {t.registered}
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {new Date(member.createdAt).toLocaleString("en-TZ")}
                  </dd>
                </div>

              </dl>

            </div>

            {/* Phone numbers */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <p className="text-lg font-bold text-gray-900">
                {t.phoneNumbersTitle}
              </p>

              {member.phoneNumbers.length === 0 ? (

                <p className="mt-4 text-sm text-gray-500">
                  {t.noPhoneNumbers}
                </p>

              ) : (

                <ul className="mt-4 divide-y divide-gray-100">

                  {member.phoneNumbers.map((phone) => (

                    <li
                      key={phone.phoneId}
                      className="flex items-center justify-between py-3"
                    >

                      <div>
                        <p className="font-semibold text-gray-900">
                          {phone.phoneNumber}
                          {phone.isPrimary && (
                            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                              {t.primary}
                            </span>
                          )}
                        </p>

                        <p className="text-sm text-gray-500">
                          {operatorName(phone.operatorId)}
                        </p>
                      </div>

                      <span className="text-sm text-gray-500">
                        {phone.phoneStatus}
                      </span>

                    </li>

                  ))}

                </ul>

              )}

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
