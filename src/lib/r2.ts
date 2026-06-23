import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

/**
 * Upload a preview image to Cloudflare R2
 */
export async function uploadPreviewToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  // AWS SDK v3 fails if the underlying buffer is a SharedArrayBuffer (common in Vercel with Sharp).
  // We force a copy into a standard ArrayBuffer-backed Uint8Array.
  const safeArrayBuffer = new ArrayBuffer(buffer.length);
  const safeUint8Array = new Uint8Array(safeArrayBuffer);
  safeUint8Array.set(new Uint8Array(buffer));

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: safeUint8Array,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return getPublicPreviewUrl(key);
}

/**
 * Get the public URL for a preview stored in R2
 */
export function getPublicPreviewUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`;
}

/**
 * Delete a preview from R2
 */
export async function deletePreviewFromR2(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

/**
 * Generate a presigned URL for direct upload to R2 (bypass Vercel body limit)
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Get an object (file buffer) from R2
 */
export async function getObjectFromR2(key: string): Promise<Buffer> {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );

  const stream = response.Body;
  if (!stream) throw new Error("Empty response body from R2");

  const chunks: Uint8Array[] = [];
  // @ts-expect-error - ReadableStream from AWS SDK
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Build the R2 key for a photo preview
 */
export function buildPreviewKey(albumId: string, photoId: string): string {
  return `albums/${albumId}/previews/${photoId}.webp`;
}

/**
 * Build the R2 key for a temporary original upload
 */
export function buildTempOriginalKey(albumId: string, fileName: string): string {
  return `temp/${albumId}/${Date.now()}-${fileName}`;
}
