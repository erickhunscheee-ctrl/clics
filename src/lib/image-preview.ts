import sharp from "sharp";

interface PreviewResult {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  contentType: string;
}

/**
 * Generate a compressed preview image from the original file buffer
 * - Max width: 1200px
 * - Format: WebP
 * - Quality: 75
 * - Preserves aspect ratio
 * - Watermark support prepared for future implementation
 */
export async function generatePhotoPreview(
  fileBuffer: Buffer,
  options?: {
    maxWidth?: number;
    quality?: number;
    enableWatermark?: boolean;
  }
): Promise<PreviewResult> {
  const maxWidth = options?.maxWidth ?? 1200;
  const quality = options?.quality ?? 75;
  // Watermark flag prepared for future use
  // const enableWatermark = options?.enableWatermark ?? false;

  let pipeline = sharp(fileBuffer)
    .resize({
      width: maxWidth,
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality });

  // TODO: Future watermark implementation
  // if (enableWatermark) {
  //   const watermarkBuffer = await createWatermarkOverlay(width, height);
  //   pipeline = pipeline.composite([{
  //     input: watermarkBuffer,
  //     gravity: 'center',
  //   }]);
  // }

  const outputBuffer = await pipeline.toBuffer();
  const metadata = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    size: outputBuffer.length,
    contentType: "image/webp",
  };
}

/**
 * Get metadata from the original image file
 */
export async function getImageMetadata(
  fileBuffer: Buffer
): Promise<{ width: number; height: number; size: number }> {
  const metadata = await sharp(fileBuffer).metadata();
  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    size: fileBuffer.length,
  };
}
