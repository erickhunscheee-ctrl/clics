ALTER TABLE "albums" ADD COLUMN "defaultVideoPrice" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "videos" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "albumId" TEXT NOT NULL,
  "originalFileName" TEXT NOT NULL,
  "originalMimeType" TEXT NOT NULL,
  "originalR2Key" TEXT NOT NULL,
  "previewR2Key" TEXT NOT NULL,
  "previewUrl" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "status" "PhotoStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "videos_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "videos_albumId_idx" ON "videos"("albumId");
CREATE UNIQUE INDEX "videos_originalR2Key_key" ON "videos"("originalR2Key");

ALTER TABLE "order_items" ALTER COLUMN "photoId" DROP NOT NULL;
ALTER TABLE "order_items" ADD COLUMN "videoId" TEXT;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "order_items_orderId_videoId_key" ON "order_items"("orderId", "videoId");
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_media_check" CHECK (("photoId" IS NOT NULL) <> ("videoId" IS NOT NULL));
