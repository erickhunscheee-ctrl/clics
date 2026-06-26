ALTER TABLE "albums" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "albums_isFeatured_idx" ON "albums"("isFeatured");
