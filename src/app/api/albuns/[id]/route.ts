import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePhotographer } from "@/lib/auth";
import { assertOwnership } from "@/lib/permissions";
import { albumSchema } from "@/lib/validators/album";
import { slugify } from "@/lib/slug";
import { percentToBps } from "@/lib/promotions";
import { ZodError } from "zod";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/albuns/[id] - Obter detalhes de um álbum
export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requirePhotographer();
    const { id } = await params;

    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        photos: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!album) {
      return NextResponse.json({ message: "Álbum não encontrado." }, { status: 404 });
    }

    assertOwnership(user.id, album.photographerId);

    return NextResponse.json(album);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao buscar album.";
    return NextResponse.json(
      { message },
      { status: message === "Não autenticado" ? 401 : 403 }
    );
  }
}

// PUT /api/albuns/[id] - Atualizar um álbum
export async function PUT(request: Request, { params }: Params) {
  try {
    const user = await requirePhotographer();
    const { id } = await params;
    const body = await request.json();

    const album = await prisma.album.findUnique({
      where: { id },
    });

    if (!album) {
      return NextResponse.json({ message: "Álbum não encontrado." }, { status: 404 });
    }

    assertOwnership(user.id, album.photographerId);

    const validatedData = albumSchema.parse(body);

    // Se o título mudou, regeneramos o slug correspondente
    let slug = album.slug;
    if (validatedData.title !== album.title) {
      slug = await slugify(validatedData.title);
    }

    const updatedAlbum = await prisma.album.update({
      where: { id },
      data: {
        title: validatedData.title,
        slug,
        description: validatedData.description,
        eventDate: validatedData.eventDate ? new Date(validatedData.eventDate) : null,
        location: validatedData.location,
        defaultPhotoPrice: Math.round(validatedData.defaultPhotoPrice * 100), // Reais para centavos
        promotionEnabled: validatedData.promotionEnabled,
        promotionMinPhotos: validatedData.promotionMinPhotos,
        promotionDiscountBps: percentToBps(validatedData.promotionDiscountPercent),
      },
    });

    return NextResponse.json(updatedAlbum);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Dados inválidos.", errors: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Erro ao atualizar album.";
    return NextResponse.json(
      { message },
      { status: message === "Não autenticado" ? 401 : 403 }
    );
  }
}

// DELETE /api/albuns/[id] - Excluir um álbum
export async function DELETE(request: Request, { params }: Params) {
  try {
    const user = await requirePhotographer();
    const { id } = await params;

    const album = await prisma.album.findUnique({
      where: { id },
    });

    if (!album) {
      return NextResponse.json({ message: "Álbum não encontrado." }, { status: 404 });
    }

    assertOwnership(user.id, album.photographerId);

    // Deleta o álbum (e suas fotos por cascata se configurado no DB,
    // mas o ideal é futuramente limpar os storages correspondentes R2/Drive)
    await prisma.album.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Álbum excluído com sucesso." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao excluir album.";
    return NextResponse.json(
      { message },
      { status: message === "Não autenticado" ? 401 : 403 }
    );
  }
}
