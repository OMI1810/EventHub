ALTER TABLE "event_entry_logs"
DROP CONSTRAINT "event_entry_logs_turniket_user_id_fkey";

ALTER TABLE "event_entry_logs"
ALTER COLUMN "turniket_user_id" DROP NOT NULL;

CREATE TABLE "event_turnikets" (
  "id_turniket" TEXT NOT NULL,
  "event_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_by_admin_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "event_turnikets_pkey" PRIMARY KEY ("id_turniket")
);

CREATE UNIQUE INDEX "event_turnikets_user_id_key"
ON "event_turnikets"("user_id");

CREATE UNIQUE INDEX "event_turnikets_event_id_label_key"
ON "event_turnikets"("event_id", "label");

CREATE UNIQUE INDEX "event_turnikets_event_id_user_id_key"
ON "event_turnikets"("event_id", "user_id");

ALTER TABLE "event_turnikets"
ADD CONSTRAINT "event_turnikets_event_id_fkey"
FOREIGN KEY ("event_id") REFERENCES "events"("id_event")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_turnikets"
ADD CONSTRAINT "event_turnikets_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id_user")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_turnikets"
ADD CONSTRAINT "event_turnikets_created_by_admin_id_fkey"
FOREIGN KEY ("created_by_admin_id") REFERENCES "users"("id_user")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "event_entry_logs"
ADD CONSTRAINT "event_entry_logs_turniket_user_id_fkey"
FOREIGN KEY ("turniket_user_id") REFERENCES "users"("id_user")
ON DELETE SET NULL ON UPDATE CASCADE;
