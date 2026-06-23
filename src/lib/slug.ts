import { prisma } from "./prisma";

/**
 * Generate a URL-friendly slug from a title
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/[\s_]+/g, "-") // Spaces/underscores to hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ""); // Trim hyphens
}

/**
 * Generate a unique slug for an album
 * Appends a numeric suffix if the slug already exists
 */
export async function generateUniqueSlug(title: string): Promise<string> {
  let slug = slugify(title);

  if (!slug) {
    slug = `album-${Date.now()}`;
  }

  const existing = await prisma.album.findUnique({ where: { slug } });

  if (!existing) {
    return slug;
  }

  // Try appending numbers until unique
  let counter = 1;
  let candidate = `${slug}-${counter}`;

  while (await prisma.album.findUnique({ where: { slug: candidate } })) {
    counter++;
    candidate = `${slug}-${counter}`;
  }

  return candidate;
}
