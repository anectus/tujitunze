"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { getAccessToken } from "@/lib/utils/permissions";
import { useLanguage } from "@/lib/context/LanguageContext";
import { memberNotificationsTranslations } from "@/constants/translations/member-notifications";
import { commonTranslations } from "@/constants/translations/common";
import { API_URL } from "@/lib/utils/api";
import PageContainer from "@/components/dashboard/PageContainer";
import Button from "@/components/common/Button";

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

// Blocking confirm dialog for the one destructive action on this page.
// Self-contained rather than routed through components/modals/*.tsx or
// components/ui/Modal.tsx — both are empty stubs with no established
// contract, same reasoning the Settings page's own ConfirmDialog gives.
function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  busy: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={busy ? undefined : onCancel} />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="notification-delete-dialog-title"
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <h3 id="notification-delete-dialog-title" className="text-lg font-bold text-gray-900">
          {title}
        </h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>

        {error && (
          <p className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// How long the fade-out plays before a deleted row actually leaves
// `notifications` — must match the opacity transition's duration below,
// or the row would either snap away before finishing its fade or sit
// invisible-but-present for longer than it needs to.
const DELETE_FADE_MS = 300;

export default function NotificationsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = memberNotificationsTranslations[language];
  const common = commonTranslations[language];

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  // Ids currently mid fade-out — still rendered (opacity-0) so the CSS
  // transition has something to animate, removed from `notifications`
  // only once DELETE_FADE_MS has elapsed.
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

  const loadNotifications = useCallback(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t.errorFallback only changes with language, not something this fetch should re-run for
  }, [router]);

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only fetch
  }, []);

  // Update local state directly rather than refetching the list — the new
  // state is already known from a successful PATCH, so there's no need for
  // a round trip just to redraw the same rows.
  const markRead = (notificationId: number) => {
    const token = getAccessToken();

    if (!token) {
      return;
    }

    const target = notifications.find((item) => item.notificationId === notificationId);

    if (!target || target.readStatus) {
      return;
    }

    setNotifications((items) =>
      items.map((item) =>
        item.notificationId === notificationId ? { ...item, readStatus: true } : item
      )
    );
    setUnreadCount((count) => Math.max(0, count - 1));

    fetch(`${API_URL}/members/notifications/${notificationId}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {
      // Best-effort — an occasional failed PATCH just leaves this one
      // notification unread server-side; the next full list load (a
      // fresh page visit) reflects the real state either way.
    });
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

    loadNotifications();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    const token = getAccessToken();

    if (!token) {
      return;
    }

    const { id } = deleteTarget;

    setDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(`${API_URL}/members/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || t.deleteErrorFallback);
      }

      setDeleteTarget(null);
      // Optimistic: start the fade immediately rather than waiting for
      // the list to be refetched.
      setRemovingIds((ids) => new Set(ids).add(id));

      setTimeout(() => {
        setNotifications((items) => {
          const deleted = items.find((item) => item.notificationId === id);

          if (deleted && !deleted.readStatus) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }

          return items.filter((item) => item.notificationId !== id);
        });

        setRemovingIds((ids) => {
          const next = new Set(ids);
          next.delete(id);
          return next;
        });
      }, DELETE_FADE_MS);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t.deleteErrorFallback);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageContainer backHref="/dashboard" backLabel={common.backToDashboard}>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

          <h1 className="text-3xl font-bold text-gray-900">
            {t.heading}
          </h1>

          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={markAllRead}>
              {t.markAllAsRead} ({unreadCount})
            </Button>
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

            {notifications.map((notification) => {
              const isRemoving = removingIds.has(notification.notificationId);

              return (

                <li
                  key={notification.notificationId}
                  role="button"
                  tabIndex={0}
                  aria-label={notification.title}
                  onClick={() => markRead(notification.notificationId)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      markRead(notification.notificationId);
                    }
                  }}
                  className={`cursor-pointer px-6 py-4 transition-[background-color,opacity] duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400 ${
                    isRemoving ? "opacity-0" : "opacity-100"
                  } ${notification.readStatus ? "bg-gray-50" : "bg-emerald-50"}`}
                >
                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full transition-colors duration-300 ${
                            notification.readStatus ? "bg-gray-400" : "bg-emerald-600"
                          }`}
                        />
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

                    <div className="flex shrink-0 items-center gap-3">
                      {!notification.readStatus && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            markRead(notification.notificationId);
                          }}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                          {t.markRead}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteError("");
                          setDeleteTarget({
                            id: notification.notificationId,
                            title: notification.title,
                          });
                        }}
                        aria-label={`${common.delete} ${notification.title}`}
                        className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        {common.delete}
                      </button>
                    </div>

                  </div>
                </li>

              );
            })}

          </ul>

        )}

        {deleteTarget && (
          <ConfirmDialog
            title={t.deleteConfirmTitle}
            message={t.deleteConfirmMessageTemplate.replace("{title}", deleteTarget.title)}
            confirmLabel={deleting ? t.deleting : common.delete}
            cancelLabel={common.cancel}
            busy={deleting}
            error={deleteError}
            onConfirm={confirmDelete}
            onCancel={() => {
              setDeleteError("");
              setDeleteTarget(null);
            }}
          />
        )}

    </PageContainer>
  );
}
