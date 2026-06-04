CREATE TABLE "event_admin_access" (
    "id_access" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT true,
    "can_edit_general" BOOLEAN NOT NULL DEFAULT false,
    "can_edit_settings" BOOLEAN NOT NULL DEFAULT false,
    "can_edit_materials" BOOLEAN NOT NULL DEFAULT false,
    "can_edit_cases" BOOLEAN NOT NULL DEFAULT false,
    "can_view_participants" BOOLEAN NOT NULL DEFAULT false,
    "can_view_teams" BOOLEAN NOT NULL DEFAULT false,
    "can_view_solutions" BOOLEAN NOT NULL DEFAULT false,
    "can_view_results" BOOLEAN NOT NULL DEFAULT false,
    "can_edit_results" BOOLEAN NOT NULL DEFAULT false,
    "can_delete_results" BOOLEAN NOT NULL DEFAULT false,
    "can_finish_event" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_admin_access_pkey" PRIMARY KEY ("id_access")
);

CREATE UNIQUE INDEX "event_admin_access_event_id_user_id_key" ON "event_admin_access"("event_id", "user_id");

ALTER TABLE "event_admin_access" ADD CONSTRAINT "event_admin_access_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id_event") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_admin_access" ADD CONSTRAINT "event_admin_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
