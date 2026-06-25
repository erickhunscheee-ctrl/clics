import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePhotographer } from "@/lib/auth";
import { assertOwnership } from "@/lib/permissions";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/albuns/[id]/publish - Publicar ou Despublicar/Arquivar o álbum
export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requirePhotographer();
    const { id } = await params;
    const { action } = await request.json(); // "publish" ou "archive" ou "draft"

    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        _count: {
          select: { photos: true },
        },
      },
    });

    if (!album) {
      return NextResponse.json({ message: "Álbum não encontrado." }, { status: 404 });
    }

    assertOwnership(user.id, album.photographerId);

    let nextStatus: "PUBLISHED" | "ARCHIVED" | "DRAFT" = "DRAFT";

    if (action === "publish") {
      if (album._count.photos === 0) {
        return NextResponse.json(
          { message: "Você não pode publicar um álbum sem fotos." },
          { status: 400 }
        );
      }
      nextStatus = "PUBLISHED";
    } else if (action === "archive") {
      nextStatus = "ARCHIVED";
    } else {
      nextStatus = "DRAFT";
    }

    const updatedAlbum = await prisma.album.update({
      where: { id },
      data: { status: nextStatus },
    });

    return NextResponse.json(updatedAlbum);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Erro ao mudar status do álbum." },
      { status: error.message === "Não autenticado" ? 401 : 500 }
    );
  }
}
