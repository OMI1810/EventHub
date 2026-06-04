ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TURNIKET';

CREATE TYPE "EventEntryDecisionCode" AS ENUM (
  'ALLOW',
  'DENY_EXPIRED',
  'DENY_REPLAY',
  'DENY_INVALID',
  'DENY_NOT_ELIGIBLE'
);

ALTER TABLE "events"
ADD COLUMN "has_entry_pass" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "event_entry_logs" (
  "id_event_entry_log" TEXT NOT NULL,
  "event_id" TEXT,
  "user_id" TEXT,
  "turniket_user_id" TEXT NOT NULL,
  "team_id" TEXT,
  "case_id" TEXT,
  "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decision" "EventEntryDecisionCode" NOT NULL,
  "token_jti" TEXT,
  "turniket_label_snapshot" TEXT,
  "user_display_name_snapshot" TEXT,
  "event_title_snapshot" TEXT,
  "was_first_successful_entry" BOOLEAN NOT NULL DEFAULT false,
  "failure_reason" TEXT,
  "scanner_device_id" TEXT,

  CONSTRAINT "event_entry_logs_pkey" PRIMARY KEY ("id_event_entry_log")
);

CREATE INDEX "event_entry_logs_event_id_scanned_at_idx"
ON "event_entry_logs"("event_id", "scanned_at");

CREATE INDEX "event_entry_logs_user_id_scanned_at_idx"
ON "event_entry_logs"("user_id", "scanned_at");

CREATE INDEX "event_entry_logs_turniket_user_id_scanned_at_idx"
ON "event_entry_logs"("turniket_user_id", "scanned_at");

CREATE INDEX "event_entry_logs_decision_scanned_at_idx"
ON "event_entry_logs"("decision", "scanned_at");

ALTER TABLE "event_entry_logs"
ADD CONSTRAINT "event_entry_logs_event_id_fkey"
FOREIGN KEY ("event_id") REFERENCES "events"("id_event")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "event_entry_logs"
ADD CONSTRAINT "event_entry_logs_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id_user")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "event_entry_logs"
ADD CONSTRAINT "event_entry_logs_turniket_user_id_fkey"
FOREIGN KEY ("turniket_user_id") REFERENCES "users"("id_user")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_entry_logs"
ADD CONSTRAINT "event_entry_logs_team_id_fkey"
FOREIGN KEY ("team_id") REFERENCES "teams"("id_team")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "event_entry_logs"
ADD CONSTRAINT "event_entry_logs_case_id_fkey"
FOREIGN KEY ("case_id") REFERENCES "cases"("id_case")
ON DELETE SET NULL ON UPDATE CASCADE;
