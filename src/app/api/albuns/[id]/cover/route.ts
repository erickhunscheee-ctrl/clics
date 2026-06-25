import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { assertOwnership } from "@/lib/permissions";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/albuns/[id]/cover - Define uma foto do album como capa
export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { photoId } = await request.json();

    if (!photoId || typeof photoId !== "string") {
      return NextResponse.json(
        { message: "Informe a foto que sera usada como capa." },
        { status: 400 }
      );
    }

    const album = await prisma.album.findUnique({
      where: { id },
      select: {
        id: true,
        photographerId: true,
      },
    });

    if (!album) {
      return NextResponse.json({ message: "Album nao encontrado." }, { status: 404 });
    }

    assertOwnership(user.id, album.photographerId);

    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        albumId: id,
      },
      select: {
        previewUrl: true,
      },
    });

    if (!photo) {
      return NextResponse.json(
        { message: "Foto nao encontrada neste album." },
        { status: 404 }
      );
    }

    const updatedAlbum = await prisma.album.update({
      where: { id },
      data: {
        coverImageUrl: photo.previewUrl,
      },
    });

    return NextResponse.json(updatedAlbum);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao definir capa do album.";

    return NextResponse.json(
      { message },
      { status: message === "Nao autenticado" ? 401 : 403 }
    );
  }
}
