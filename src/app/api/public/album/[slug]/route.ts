import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { message: "Slug do album nao fornecido." },
        { status: 400 }
      );
    }

    const baseAlbumSelect = {
      id: true,
      title: true,
      description: true,
      eventDate: true,
      location: true,
      coverImageUrl: true,
      defaultPhotoPrice: true,
      status: true,
      promotionEnabled: true,
      promotionMinPhotos: true,
      promotionDiscountBps: true,
      photographer: {
        select: {
          name: true,
          avatarUrl: true,
        },
      },
      photos: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          folderId: true,
          originalFileName: true,
          previewUrl: true,
          price: true,
          width: true,
          height: true,
          fileSize: true,
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
    } as const;

    const album = await prisma.album.findUnique({
      where: { slug },
      select: baseAlbumSelect,
    });

    if (!album || album.status !== "PUBLISHED") {
      return NextResponse.json(
        { message: "Album nao encontrado ou nao esta publicado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: album.id,
      title: album.title,
      description: album.description,
      eventDate: album.eventDate,
      location: album.location,
      coverImageUrl: album.coverImageUrl,
      defaultPhotoPrice: album.defaultPhotoPrice,
      promotionEnabled: album.promotionEnabled ?? false,
      promotionMinPhotos: album.promotionMinPhotos ?? 0,
      promotionDiscountBps: album.promotionDiscountBps ?? 0,
      photographer: album.photographer,
      folders: album.folders ?? [],
      photos: album.photos ?? [],
    });
  } catch (error: unknown) {
    console.error("Erro ao buscar album publico:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor ao carregar o album." },
      { status: 500 }
    );
  }
}
