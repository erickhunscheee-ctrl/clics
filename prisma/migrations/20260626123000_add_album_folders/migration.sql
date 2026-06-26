CREATE TABLE IF NOT EXISTS "album_folders" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "album_folders_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "folderId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "album_folders_albumId_name_key" ON "album_folders"("albumId", "name");
CREATE INDEX IF NOT EXISTS "album_folders_albumId_idx" ON "album_folders"("albumId");
CREATE INDEX IF NOT EXISTS "photos_folderId_idx" ON "photos"("folderId");

ALTER TABLE "album_folders" DROP CONSTRAINT IF EXISTS "album_folders_albumId_fkey";
ALTER TABLE "album_folders" ADD CONSTRAINT "album_folders_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "photos" DROP CONSTRAINT IF EXISTS "photos_folderId_fkey";
ALTER TABLE "photos" ADD CONSTRAINT "photos_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "album_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
