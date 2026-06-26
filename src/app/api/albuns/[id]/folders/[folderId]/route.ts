import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePhotographer } from "@/lib/auth";
import { assertOwnership } from "@/lib/permissions";

interface Params {
  params: Promise<{ id: string; folderId: string }>;
}

async function requireOwnedFolder(albumId: string, folderId: string, userId: string) {
  const folder = await prisma.albumFolder.findFirst({
    where: { id: folderId, albumId },
    include: {
      album: {
        select: { photographerId: true },
      },
    },
  });

  if (!folder) {
    return null;
  }

  assertOwnership(userId, folder.album.photographerId);
  return folder;
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = await requirePhotographer();
    const { id, folderId } = await params;
    const { name } = await request.json();
    const folderName = typeof name === "string" ? name.trim() : "";

    if (folderName.length < 2 || folderName.length > 80) {
      return NextResponse.json(
        { message: "Informe um nome de pasta entre 2 e 80 caracteres." },
        { status: 400 }
      );
    }

    const folder = await requireOwnedFolder(id, folderId, user.id);

    if (!folder) {
      return NextResponse.json({ message: "Pasta nao encontrada." }, { status: 404 });
    }

    const updatedFolder = await prisma.albumFolder.update({
      where: { id: folder.id },
      data: { name: folderName },
      include: { _count: { select: { photos: true } } },
    });

    return NextResponse.json(updatedFolder);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao renomear pasta.";

    return NextResponse.json(
      { message: message.includes("Unique constraint") ? "Ja existe uma pasta com esse nome." : message },
      { status: message === "Nao autenticado" ? 401 : 400 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requirePhotographer();
    const { id, folderId } = await params;
    const folder = await requireOwnedFolder(id, folderId, user.id);

    if (!folder) {
      return NextResponse.json({ message: "Pasta nao encontrada." }, { status: 404 });
    }

    await prisma.albumFolder.delete({
      where: { id: folder.id },
    });

    return NextResponse.json({ message: "Pasta excluida com sucesso." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao excluir pasta.";

    return NextResponse.json(
      { message },
      { status: message === "Nao autenticado" ? 401 : 403 }
    );
  }
}
