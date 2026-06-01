ALTER TABLE "user_event" ADD COLUMN "case_id" TEXT;

ALTER TABLE "user_event" ADD CONSTRAINT "user_event_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id_case") ON DELETE SET NULL ON UPDATE CASCADE;
