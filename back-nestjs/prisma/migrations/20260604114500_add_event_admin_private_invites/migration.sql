ALTER TABLE "event_admin_access"
ADD COLUMN "can_manage_private_invites" BOOLEAN NOT NULL DEFAULT false;
