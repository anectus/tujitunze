"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { useLanguage } from "@/lib/context/LanguageContext";
import { commonTranslations } from "@/constants/translations/common";
import { telecomMembersTranslations } from "@/constants/translations/telecom-members";

interface MemberPhone {
  phoneId: number;
  phoneNumber: string;
  isPrimary: boolean;
  phoneStatus: string;
}

interface Member {
  user_id: number;
  first_name: string;
  surname: string;
  member_status: string;
  phone_verified: boolean;
  phone_numbers: MemberPhone[];
}

const PAGE_SIZE = 20;

export default function TelecomMembersPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = telecomMembersTranslations[language];
  const common = commonTranslations[language];

  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`http://localhost:3002/telecom/members?page=${page}&pageSize=${PAGE_SIZE}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || t.loadError);
        }

        return data;
      })
      .then((data) => {
        setMembers(data.items);
        setTotal(data.total);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : t.loadError)
      )
      .finally(() => setLoading(false));
  }, [router, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>

      <DashboardHeader title={t.headerTitle} />

      <div className="p-4 sm:p-8">

        <p className="mb-4 text-sm text-gray-500">
          {t.subtitle}
        </p>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="text-gray-500">{common.loading}</p>

        ) : members.length === 0 ? (

          <p className="text-gray-500">{t.emptyState}</p>

        ) : (

          <>
            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

              <table className="w-full text-left text-sm">

                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">{t.name}</th>
                    <th className="px-6 py-3 font-semibold">{t.memberStatus}</th>
                    <th className="px-6 py-3 font-semibold">{t.phoneNumbers}</th>
                    <th className="px-6 py-3 font-semibold">{t.membershipVerification}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {members.map((member) => (

                    <tr key={member.user_id}>

                      <td className="px-6 py-4 font-medium text-gray-900">
                        {member.first_name} {member.surname}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge domain="member" status={member.member_status} />
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {member.phone_numbers.map((phone) => (
                          <div key={phone.phoneId}>
                            {phone.phoneNumber}
                            {phone.isPrimary && (
                              <span className="ml-1 text-xs text-blue-700">{t.primary}</span>
                            )}
                          </div>
                        ))}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {member.phone_verified ? t.verified : t.notVerified}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm">

                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-gray-300 px-4 py-2
                  font-semibold text-gray-700 transition hover:bg-white
                  disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.previous}
                </button>

                <span className="text-gray-500">{t.pageOf(page, totalPages)}</span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-gray-300 px-4 py-2
                  font-semibold text-gray-700 transition hover:bg-white
                  disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.next}
                </button>

              </div>
            )}
          </>

        )}

      </div>

    </div>
  );
}
