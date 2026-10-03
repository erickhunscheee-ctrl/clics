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
 * Creates a layered SVG watermark for buyer previews.
 *
 * Layers (in render order):
 *   1. Orthogonal grid — horizontal + vertical lines every ~4% of image
 *   2. Cross-hatch diagonal grid ±45° — creates diamond cells that block inpainting regions
 *   3. Stipple dot pattern — high-frequency noise AI cannot separate from image detail
 *   4. Logo mosaic — logo tiled across every region with staggered offset rows
 *   5. Diagonal text at -35° (white + black dual pass) — adapts to any background color
 *   6. Diagonal text at +20° — second angle ensures no clean scan direction exists
 *
 * Repeated branding discourages reuse while subtle textures preserve photo detail.
 * This is a visual deterrent, not a guarantee against AI removal.
 */
async function createWatermarkAndGridOverlay(width: number, height: number): Promise<Buffer> {
  // Keeps the preview protected without competing too much with the photo itself.
  const watermarkOpacity = 0.35;
  const logoPath = path.join(process.cwd(), "public", "logo_clics_branco.png");
  const logoBuffer = await readFile(logoPath);
  const logoMetadata = await sharp(logoBuffer).metadata();
  const logoAspectRatio = (logoMetadata.height ?? 1) / (logoMetadata.width ?? 1);
  const logoBase64 = logoBuffer.toString("base64");

  const minDimension = Math.min(width, height) || 100;

  // ── CAMADA 1: Grid ortogonal ─────────────────────────────────────────────
  const step = Math.max(12, Math.round(minDimension * 0.07));
  const gridLines: string[] = [];
  for (let x = step; x < width; x += step) {
    gridLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="white" stroke-width="1.5" stroke-opacity="0.50" />`);
  }
  for (let y = step; y < height; y += step) {
    gridLines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="white" stroke-width="1.5" stroke-opacity="0.50" />`);
  }

  // ── CAMADA 2: Cross-hatch diagonal ±45° ─────────────────────────────────
  // Linhas diagonais cruzadas criam losangos — nenhuma célula retangular limpa fica disponível
  const diagStep = Math.max(18, Math.round(minDimension * 0.09));
  const diagLines: string[] = [];
  // +45° (canto superior-esquerdo → inferior-direito)
  for (let start = -height; start < width + height; start += diagStep) {
    diagLines.push(
      `<line x1="${start}" y1="0" x2="${start + height}" y2="${height}" ` +
      `stroke="white" stroke-width="1" stroke-opacity="0.30" />`
    );
  }
  // -45° (canto superior-direito → inferior-esquerdo)
  for (let start = 0; start < width + height; start += diagStep) {
    diagLines.push(
      `<line x1="${start}" y1="0" x2="${start - height}" y2="${height}" ` +
      `stroke="white" stroke-width="1" stroke-opacity="0.30" />`
    );
  }

  // ── CAMADA 3: Padrão de pontos (stipple) ─────────────────────────────────
  // Ruído de alta frequência: IA não consegue separar dos pixels da foto original
  const dotSpacing = Math.max(6, Math.round(minDimension * 0.035));
  const dotRadius = Math.max(0.75, minDimension * 0.0015);
  const dotPatternDef = `
    <defs>
      <pattern id="stipple" x="0" y="0" width="${dotSpacing}" height="${dotSpacing}" patternUnits="userSpaceOnUse">
        <circle cx="${dotSpacing / 2}" cy="${dotSpacing / 2}" r="${dotRadius}" fill="white" opacity="0.40"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#stipple)"/>`;

  // ── CAMADA 4: Mosaico de logos ───────────────────────────────────────────
  // Logo em grade: ~25% da largura por célula, offset intercalado por coluna
  const tileW = Math.round(width * 0.25);
  const tileH = Math.round(tileW * logoAspectRatio);
  const tiledLogos: string[] = [];
  const colCount = Math.ceil(width / tileW) + 1;
  const rowCount = Math.ceil(height / (tileH > 0 ? tileH : 1)) + 1;
  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      const yOffset = col % 2 === 0 ? 0 : tileH / 2;
      tiledLogos.push(
        `<image href="data:image/png;base64,${logoBase64}" ` +
        `width="${tileW}" height="${tileH}" ` +
        `x="${col * tileW}" y="${row * tileH + yOffset - tileH * 0.1}" ` +
        `opacity="0.80" preserveAspectRatio="xMidYMid meet" />`
      );
    }
  }

  // ── CAMADAS 5+6: Texto em dois ângulos diferentes ────────────────────────
  const fontSize = Math.max(18, Math.round(minDimension * 0.035));
  const fontSize2 = Math.max(14, Math.round(minDimension * 0.028));
  const textSpacing = Math.round(minDimension * 0.18);
  const brand = "CLICS • CLICS • CLICS • CLICS • CLICS • CLICS •";
  const textLayers: string[] = [];

  // Camada 5: -35° — branco (fundos escuros) + preto (fundos claros)
  for (let offset = -height; offset < width + height; offset += textSpacing) {
    textLayers.push(
      `<text x="${offset}" y="0" fill="white" fill-opacity="0.60" ` +
      `font-size="${fontSize}" font-family="Arial Black, Arial, sans-serif" font-weight="900" ` +
      `letter-spacing="6" transform="rotate(-35)">${brand}</text>`
    );
    textLayers.push(
      `<text x="${offset + textSpacing / 2}" y="0" fill="black" fill-opacity="0.35" ` +
      `font-size="${fontSize}" font-family="Arial Black, Arial, sans-serif" font-weight="900" ` +
      `letter-spacing="6" transform="rotate(-35)">${brand}</text>`
    );
  }

  // Camada 6: +20° — segundo ângulo, nenhuma direção de "varredura" fica limpa
  for (let offset = -width; offset < width + height; offset += textSpacing) {
    textLayers.push(
      `<text x="${offset}" y="0" fill="white" fill-opacity="0.45" ` +
      `font-size="${fontSize2}" font-family="Arial Black, Arial, sans-serif" font-weight="900" ` +
      `letter-spacing="4" transform="rotate(20)">${brand}</text>`
    );
  }

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="transparent"/>
      <g opacity="${watermarkOpacity}">
        <g opacity="0.20">
          ${dotPatternDef}
          ${gridLines.join("\n          ")}
          ${diagLines.join("\n          ")}
        </g>
        <g opacity="0.75">
          ${tiledLogos.join("\n          ")}
          ${textLayers.join("\n          ")}
        </g>
      </g>
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
