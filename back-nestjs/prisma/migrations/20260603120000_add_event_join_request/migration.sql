CREATE TABLE "event_join_request" (
    "id_join_event" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "StatusJoinRequest" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "event_join_request_pkey" PRIMARY KEY ("id_join_event")
);

CREATE UNIQUE INDEX "event_join_request_userId_eventId_key" ON "event_join_request"("userId", "eventId");

ALTER TABLE "event_join_request" ADD CONSTRAINT "event_join_request_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id_event") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_join_request" ADD CONSTRAINT "event_join_request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
