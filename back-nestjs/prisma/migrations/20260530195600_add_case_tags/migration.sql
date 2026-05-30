CREATE TABLE IF NOT EXISTS "case_tag" (
  "case_id" TEXT NOT NULL,
  "tag_id" TEXT NOT NULL,

  CONSTRAINT "case_tag_case_id_fkey"
    FOREIGN KEY ("case_id")
    REFERENCES "cases"("id_case")
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT "case_tag_tag_id_fkey"
    FOREIGN KEY ("tag_id")
    REFERENCES "tags"("id_tag")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "case_tag_case_id_tag_id_key"
  ON "case_tag"("case_id", "tag_id");
