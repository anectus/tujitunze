-- ============================================================
-- Migration 0031
-- Adds timestamp tracking the Notifications module needs to record when
-- a member actually read or deleted a notification, not just the
-- current read_status boolean:
--
-- 1. `read_at`: set the first time a notification transitions to read
--    (via PATCH /members/notifications/:id/read or the /read-all bulk
--    action). NULL means still unread.
--
-- 2. `deleted_at`: soft-delete marker for DELETE
--    /members/notifications/:id — notifications belong to a member's own
--    activity history, so a hard DELETE would destroy that record for no
--    real benefit; NotificationsService filters deleted_at IS NULL
--    everywhere a member-facing list/count is built, the same
--    "soft-delete, filter at the query layer" approach this schema has
--    no prior instance of yet, but is the least surprising one given the
--    rest of this table is an append-only activity log.
-- ============================================================

BEGIN;

ALTER TABLE notifications
    ADD COLUMN read_at TIMESTAMP NULL,
    ADD COLUMN deleted_at TIMESTAMP NULL;

COMMENT ON COLUMN notifications.read_at IS
    'Set once, the first time this notification transitions to read_status = TRUE. NULL means unread. See NotificationsService.markRead/markAllRead.';

COMMENT ON COLUMN notifications.deleted_at IS
    'Soft-delete marker set by DELETE /members/notifications/:id. NotificationsService filters deleted_at IS NULL in every member-facing list/count query — see NotificationsService.listForMember.';

COMMIT;
