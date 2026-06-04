ALTER TABLE "event_admin_access"
ADD COLUMN "can_view_turniket_stats" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "can_manage_turnikets" BOOLEAN NOT NULL DEFAULT false;
