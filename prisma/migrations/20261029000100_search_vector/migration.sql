-- Full-text search for works.
-- The "searchVector" column (created in the init migration) is filled by this trigger
-- whenever a work's title or text changes. Titles are weighted above body text.
-- The 'simple' configuration does no stemming, so it behaves the same for every
-- language in the archive (English, Hindi, Marathi, ...). Text is Unicode-normalised
-- (NFC) for indexing only; the stored text itself is never changed.

CREATE OR REPLACE FUNCTION work_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('simple', normalize(coalesce(NEW."title", ''), NFC)), 'A') ||
    setweight(to_tsvector('simple', normalize(coalesce(NEW."body", ''), NFC)), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS work_search_vector_trigger ON "Work";
CREATE TRIGGER work_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "title", "body" ON "Work"
  FOR EACH ROW EXECUTE FUNCTION work_search_vector_update();

-- Fill the column for any rows that already exist.
UPDATE "Work" SET "title" = "title";
