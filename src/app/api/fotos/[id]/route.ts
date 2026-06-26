import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePhotographer } from "@/lib/auth";
import { assertOwnership } from "@/lib/permissions";
import { deletePreviewFromR2 } from "@/lib/r2";
import { deleteFromDrive } from "@/lib/google-drive";
import { photoSchema } from "@/lib/validators/photo";
import { ZodError } from "zod";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = await requirePhotographer();
    const photoId = (await params).id;
    const body = await request.json();

    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        album: {
          select: { photographerId: true },
        },
      },
    });

    if (!photo) {
      return NextResponse.json({ message: "Foto nao encontrada." }, { status: 404 });
    }

    assertOwnership(user.id, photo.album.photographerId);

    const validatedData = photoSchema.parse(body);

    if (validatedData.folderId) {
      const folder = await prisma.albumFolder.findFirst({
        where: {
          id: validatedData.folderId,
          albumId: photo.albumId,
        },
        select: { id: true },
      });

      if (!folder) {
        return NextResponse.json(
          { message: "Pasta nao encontrada neste album." },
          { status: 404 }
        );
      }
    }

    const updatedPhoto = await prisma.photo.update({
      where: { id: photoId },
      data: {
        price: Math.round(validatedData.price * 100),
        status: validatedData.status,
        folderId: validatedData.folderId ?? null,
      },
    });

    return NextResponse.json(updatedPhoto);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Dados invalidos.", errors: error.issues },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Erro ao atualizar foto.";

    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requirePhotographer();
    const photoId = (await params).id;

    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        album: {
          select: { photographerId: true },
        },
      },
    });

    if (!photo) {
      return NextResponse.json({ message: "Foto nao encontrada." }, { status: 404 });
    }

    assertOwnership(user.id, photo.album.photographerId);

    try {
      await deletePreviewFromR2(photo.previewR2Key);
    } catch (error) {
      console.error("Falha ao apagar do R2:", error);
    }

    try {
      await deleteFromDrive(photo.driveFileId);
    } catch (error) {
      console.error("Falha ao apagar do Drive:", error);
    }

    await prisma.photo.delete({
      where: { id: photoId },
    });

    return NextResponse.json({ message: "Foto deletada com sucesso." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao deletar foto.";

    return NextResponse.json({ message }, { status: 500 });
  }
}
