-- DropIndex
DROP INDEX IF EXISTS "results_eventId_place_key";

-- CreateIndex
CREATE INDEX "results_eventId_caseId_place_idx" ON "results"("eventId", "caseId", "place");
