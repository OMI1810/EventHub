DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_team'
      AND column_name = 'tag_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_team'
      AND column_name = 'team_id'
  ) THEN
    ALTER TABLE "user_team" RENAME COLUMN "tag_id" TO "team_id";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_team_tag_id_fkey'
  ) THEN
    ALTER TABLE "user_team"
    RENAME CONSTRAINT "user_team_tag_id_fkey" TO "user_team_team_id_fkey";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_team_tag_id_not_null'
  ) THEN
    ALTER TABLE "user_team"
    RENAME CONSTRAINT "user_team_tag_id_not_null" TO "user_team_team_id_not_null";
  END IF;
END $$;

ALTER INDEX IF EXISTS "user_team_user_id_tag_id_key"
RENAME TO "user_team_user_id_team_id_key";
