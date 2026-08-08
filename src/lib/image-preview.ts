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

/**
 * Creates a multi-layer SVG watermark overlay designed to be impossible to remove via AI inpainting:
 *   1. Dense protective grid covering the entire image
 *   2. Logo mosaic — logo tiled repeatedly across every region
 *   3. Diagonal repeating brand text — covers every angle
 *
 * Because every region of the image is covered by overlapping layers, AI tools cannot
 * reconstruct the original without hallucinating pixels from scratch.
 */
async function createWatermarkAndGridOverlay(width: number, height: number): Promise<Buffer> {
  const logoPath = path.join(process.cwd(), "public", "logo_clics_branco.png");
  const logoBuffer = await readFile(logoPath);
  const logoMetadata = await sharp(logoBuffer).metadata();
  const logoAspectRatio = (logoMetadata.height ?? 1) / (logoMetadata.width ?? 1);
  const logoBase64 = logoBuffer.toString("base64");

  const minDimension = Math.min(width, height) || 100;

  // ── CAMADA 1: Grid denso ─────────────────────────────────────────────────
  const step = Math.max(12, Math.round(minDimension * 0.04));
  const gridLines: string[] = [];
  for (let x = step; x < width; x += step) {
    gridLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="white" stroke-width="1.5" stroke-opacity="0.50" />`);
  }
  for (let y = step; y < height; y += step) {
    gridLines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="white" stroke-width="1.5" stroke-opacity="0.50" />`);
  }

  // ── CAMADA 2: Mosaico de logos ───────────────────────────────────────────
  // Logo em grade: ~25% da largura por célula — cobre toda a imagem
  const tileW = Math.round(width * 0.25);
  const tileH = Math.round(tileW * logoAspectRatio);
  const tiledLogos: string[] = [];
  const colCount = Math.ceil(width / tileW) + 1;
  const rowCount = Math.ceil(height / (tileH > 0 ? tileH : 1)) + 1;
  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      // Offset alternado em colunas ímpares para cobertura mais densa
      const yOffset = col % 2 === 0 ? 0 : tileH / 2;
      tiledLogos.push(
        `<image href="data:image/png;base64,${logoBase64}" ` +
        `width="${tileW}" height="${tileH}" ` +
        `x="${col * tileW}" y="${row * tileH + yOffset - tileH * 0.1}" ` +
        `opacity="0.80" preserveAspectRatio="xMidYMid meet" />`
      );
    }
  }

  // ── CAMADA 3: Texto diagonal repetido ───────────────────────────────────
  // Rotacionado -35° e repetido em múltiplas faixas diagonais
  const fontSize = Math.max(18, Math.round(minDimension * 0.035));
  const textSpacing = Math.round(minDimension * 0.18);
  const brand = "CLICS • CLICS • CLICS • CLICS • CLICS • CLICS •";
  const diagonalTexts: string[] = [];
  // Cobre diagonal de -height até width+height para não deixar cantos sem marca
  for (let offset = -height; offset < width + height; offset += textSpacing) {
    // Linha clara (branco) — visível em fundos escuros
    diagonalTexts.push(
      `<text x="${offset}" y="0" fill="white" fill-opacity="0.60" ` +
      `font-size="${fontSize}" font-family="Arial Black, Arial, sans-serif" font-weight="900" ` +
      `letter-spacing="6" transform="rotate(-35)">${brand}</text>`
    );
    // Linha escura (preto) — visível em fundos claros, offset de metade do passo
    diagonalTexts.push(
      `<text x="${offset + textSpacing / 2}" y="0" fill="black" fill-opacity="0.35" ` +
      `font-size="${fontSize}" font-family="Arial Black, Arial, sans-serif" font-weight="900" ` +
      `letter-spacing="6" transform="rotate(-35)">${brand}</text>`
    );
  }

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="transparent"/>
      ${gridLines.join("\n      ")}
      ${tiledLogos.join("\n      ")}
      ${diagonalTexts.join("\n      ")}
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
  const quality = options?.quality ?? 45;
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
    // Single composite pass: grid + logo watermark — avoids double re-encoding
    const overlayBuffer = await createWatermarkAndGridOverlay(info.width, info.height);
    outputBuffer = await sharp(resizedBuffer)
      .composite([{ input: overlayBuffer, gravity: "center" }])
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
