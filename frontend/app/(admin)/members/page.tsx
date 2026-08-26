
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import StatusBadge from "@/components/common/StatusBadge";
import { useLanguage } from "@/lib/context/LanguageContext";
import { adminMembersTranslations } from "@/constants/translations/admin-members";
import { commonTranslations } from "@/constants/translations/common";
import { getStatusLabel } from "@/constants/translations/statuses";

interface AdminMember {
  userId: number;
  firstName: string;
  secondName: string | null;
  surname: string;
  email: string | null;
  nidaNumber: string;
  memberStatus: string;
  createdAt: string;
}

const STATUS_OPTIONS = ["Pending", "Active", "Suspended", "Inactive"];

export default function AdminMembersPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = adminMembersTranslations[language];
  const common = commonTranslations[language];

  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    const loadMembers = async () => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:3002/admin/members", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401 || response.status === 403) {
          router.push("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || t.loadError);
        }

        setMembers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.loadError);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [router, t.loadError]);

  const handleStatusChange = async (userId: number, status: string) => {
    const token = getAccessToken();
    if (!token) return;

    setUpdatingId(userId);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:3002/admin/members/${userId}/status`,
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

      setMembers((previous) =>
        previous.map((member) =>
          member.userId === userId
            ? { ...member, memberStatus: status }
            : member
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t.updateStatusError);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-5xl mx-auto">

        <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>

        <p className="mt-2 text-sm text-gray-600">
          {t.subtitle}
        </p>

        {error && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="mt-8 text-gray-500">{t.loading}</p>

        ) : members.length === 0 ? (

          <p className="mt-8 text-gray-500">{t.empty}</p>

        ) : (

          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">

            <table className="w-full text-left text-sm">

              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">{t.colName}</th>
                  <th className="px-6 py-3 font-semibold">{t.colNida}</th>
                  <th className="px-6 py-3 font-semibold">{t.colEmail}</th>
                  <th className="px-6 py-3 font-semibold">{t.colStatus}</th>
                  <th className="px-6 py-3 font-semibold">{t.colChangeStatus}</th>
                  <th className="px-6 py-3 font-semibold"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {members.map((member) => (

                  <tr key={member.userId}>

                    <td className="px-6 py-4 text-gray-900">
                      {[member.firstName, member.secondName, member.surname]
                        .filter(Boolean)
                        .join(" ")}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {member.nidaNumber}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {member.email || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge
                        domain="member"
                        status={member.memberStatus}
                      />
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={member.memberStatus}
                        disabled={updatingId === member.userId}
                        onChange={(e) =>
                          handleStatusChange(member.userId, e.target.value)
                        }
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
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/members/${member.userId}`}
                        className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                      >
                        {common.view}
                      </Link>
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}
