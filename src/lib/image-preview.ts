import sharp from "sharp";
import { readFile } from "node:fs/promises";
import path from "node:path";

interface PreviewResult {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  contentType: string;
}

async function createLogoWatermarkOverlay(width: number, height: number): Promise<Buffer> {
  const logoPath = path.join(process.cwd(), "public", "logo_clics_branco.png");
  const logoBuffer = await readFile(logoPath);
  const logoMetadata = await sharp(logoBuffer).metadata();
  const logoAspectRatio = (logoMetadata.height ?? 1) / (logoMetadata.width ?? 1);
  const logoWidth = Math.round(width * 0.96);
  const logoHeight = Math.round(logoWidth * logoAspectRatio);
  const logoBase64 = logoBuffer.toString("base64");

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="transparent"/>
      <image
        href="data:image/png;base64,${logoBase64}"
        width="${logoWidth}"
        height="${logoHeight}"
        x="${(width - logoWidth) / 2}"
        y="${(height - logoHeight) / 2}"
        opacity="0.60"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  `);
}

/**
 * Generate a compressed preview image from the original file buffer
 * - Max width: 1200px
 * - Format: WebP
 * - Quality: 75
 * - Preserves aspect ratio
 * - Optional CLICS logo watermark
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
  const enableWatermark = options?.enableWatermark ?? false;

  const resizedImage = sharp(fileBuffer)
    .rotate()
    .resize({
      width: maxWidth,
      withoutEnlargement: true,
      fit: "inside",
    });

  const { data: resizedBuffer, info } = await resizedImage
    .webp({ quality })
    .toBuffer({ resolveWithObject: true });

  let outputBuffer = resizedBuffer;

  if (enableWatermark && info.width > 0 && info.height > 0) {
    const watermarkBuffer = await createLogoWatermarkOverlay(info.width, info.height);
    outputBuffer = await sharp(resizedBuffer)
      .composite([{ input: watermarkBuffer, gravity: "center" }])
      .webp({ quality })
      .toBuffer();
  }

  return {
    buffer: outputBuffer,
    width: info.width,
    height: info.height,
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
