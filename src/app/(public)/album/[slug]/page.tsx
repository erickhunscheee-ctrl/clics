import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PhotoGallery } from "@/components/public-album/photo-gallery";

interface PublicAlbumPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PublicAlbumPageProps): Promise<Metadata> {
  const { slug } = await params;

  const album = await prisma.album.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: { title: true, description: true },
  });

  if (!album) {
    return {
      title: "Album nao encontrado",
    };
  }

  return {
    title: `${album.title} | Galeria de Fotos`,
    description: album.description || "Veja e adquira as fotos deste evento online.",
  };
}

export default async function PublicAlbumPage({ params }: PublicAlbumPageProps) {
  const { slug } = await params;

  const baseAlbumSelect = {
    id: true,
    slug: true,
    title: true,
    description: true,
    eventDate: true,
    location: true,
    coverImageUrl: true,
    defaultPhotoPrice: true,
    status: true,
    photographer: {
      select: {
        name: true,
        avatarUrl: true,
      },
    },
  } as const;

  const album = await prisma.album
    .findUnique({
      where: {
        slug,
        status: "PUBLISHED",
      },
      select: {
        ...baseAlbumSelect,
        photos: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            folderId: true,
            originalFileName: true,
            previewUrl: true,
            price: true,
          },
          orderBy: { createdAt: "desc" },
        },
        folders: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
    .catch(() =>
      prisma.album.findUnique({
        where: {
          slug,
          status: "PUBLISHED",
        },
        select: {
          ...baseAlbumSelect,
          photos: {
            where: { status: "ACTIVE" },
            select: {
              id: true,
              originalFileName: true,
              previewUrl: true,
              price: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      })
    );

  if (!album) {
    notFound();
  }

  const promotion = await prisma
    .$queryRaw<
      Array<{
        promotionEnabled: boolean;
        promotionMinPhotos: number;
        promotionDiscountBps: number;
      }>
    >`
      SELECT "promotionEnabled", "promotionMinPhotos", "promotionDiscountBps"
      FROM "albums"
      WHERE id = ${album.id}
      LIMIT 1
    `
    .then((rows) => rows[0] ?? null)
    .catch(() => null);

  const safeAlbum = {
    ...album,
    folders: "folders" in album ? album.folders : [],
    photos: album.photos.map((photo) => ({
      ...photo,
      folderId: "folderId" in photo ? photo.folderId : null,
    })),
    promotionEnabled: promotion?.promotionEnabled ?? false,
    promotionMinPhotos: promotion?.promotionMinPhotos ?? 0,
    promotionDiscountBps: promotion?.promotionDiscountBps ?? 0,
  };

  return <PhotoGallery album={safeAlbum} photos={safeAlbum.photos} />;
}
