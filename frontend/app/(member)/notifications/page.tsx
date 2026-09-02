"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import { useLanguage } from "@/lib/context/LanguageContext";
import { memberNotificationsTranslations } from "@/constants/translations/member-notifications";
import { commonTranslations } from "@/constants/translations/common";
import { API_URL } from "@/lib/utils/api";

interface Notification {
  notificationId: number;
  notificationType: string | null;
  title: string;
  message: string;
  sentDate: string;
  readStatus: boolean;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-TZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = memberNotificationsTranslations[language];
  const common = commonTranslations[language];

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API_URL}/members/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (response.status === 401) {
          router.push("/login");
          return null;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || t.errorFallback);
        }

        return data;
      })
      .then((data) => {
        if (data) {
          setNotifications(data.items);
          setUnreadCount(data.unreadCount);
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : t.errorFallback)
      )
      .finally(() => setLoading(false));
  }, [router, t.errorFallback]);

  // Update local state directly rather than refetching the list — the new
  // state is already known from a successful PATCH, so there's no need for
  // a round trip just to redraw the same rows.
  const markRead = async (notificationId: number) => {
    const token = getAccessToken();

    if (!token) {
      return;
    }

    await fetch(`${API_URL}/members/notifications/${notificationId}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    setNotifications((items) =>
      items.map((item) =>
        item.notificationId === notificationId ? { ...item, readStatus: true } : item
      )
    );
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const markAllRead = async () => {
    const token = getAccessToken();

    if (!token) {
      return;
    }

    await fetch(`${API_URL}/members/notifications/read-all`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    setNotifications((items) => items.map((item) => ({ ...item, readStatus: true })));
    setUnreadCount(0);
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-2xl mx-auto">

        <Link
          href="/dashboard"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← {common.backToDashboard}
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

          <h1 className="text-3xl font-bold text-gray-900">
            {t.heading}
          </h1>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              {t.markAllAsRead} ({unreadCount})
            </button>
          )}

        </div>

        {error && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="mt-8 text-gray-500">{common.loading}</p>

        ) : notifications.length === 0 ? (

          <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
            <p className="text-gray-600">{t.noNotificationsYet}</p>
            <p className="mt-2 text-sm text-gray-400">
              {t.noNotificationsHelp}
            </p>
          </div>

        ) : (

          <ul className="mt-6 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">

            {notifications.map((notification) => (

              <li
                key={notification.notificationId}
                className={`px-6 py-4 ${notification.readStatus ? "" : "bg-blue-50"}`}
              >
                <div className="flex items-start justify-between gap-4">

                  <div>
                    <div className="flex items-center gap-2">
                      {!notification.readStatus && (
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                      )}
                      <p className="font-semibold text-gray-900">
                        {notification.title}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {notification.message}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      {notification.notificationType} · {formatDate(notification.sentDate)}
                    </p>
                  </div>

                  {!notification.readStatus && (
                    <button
                      type="button"
                      onClick={() => markRead(notification.notificationId)}
                      className="shrink-0 text-xs font-semibold text-blue-700 hover:text-blue-800"
                    >
                      {t.markRead}
                    </button>
                  )}

                </div>
              </li>

            ))}

          </ul>

        )}

      </div>

    </div>
  );
}
