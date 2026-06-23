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
        { message: "Slug do álbum não fornecido." },
        { status: 400 }
      );
    }

    // Busca o álbum publicado com suas fotos ativas
    const album = await prisma.album.findUnique({
      where: {
        slug: slug,
      },
      include: {
        photos: {
          where: {
            status: "ACTIVE",
          },
          select: {
            id: true,
            originalFileName: true,
            previewUrl: true,
            price: true,
            width: true,
            height: true,
            fileSize: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        photographer: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!album || album.status !== "PUBLISHED") {
      return NextResponse.json(
        { message: "Álbum não encontrado ou não está publicado." },
        { status: 404 }
      );
    }

    // Mapeia para não retornar informações desnecessárias ou sensíveis do fotógrafo/álbum
    return NextResponse.json({
      id: album.id,
      title: album.title,
      description: album.description,
      eventDate: album.eventDate,
      location: album.location,
      coverImageUrl: album.coverImageUrl,
      defaultPhotoPrice: album.defaultPhotoPrice,
      photographer: album.photographer,
      photos: album.photos,
    });
  } catch (error: any) {
    console.error("Erro ao buscar álbum público:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor ao carregar o álbum." },
      { status: 500 }
    );
  }
}
