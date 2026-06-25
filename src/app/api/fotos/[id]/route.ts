import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePhotographer } from "@/lib/auth";
import { assertOwnership } from "@/lib/permissions";
import { deletePreviewFromR2 } from "@/lib/r2";
import { deleteFromDrive } from "@/lib/google-drive";
import { photoSchema } from "@/lib/validators/photo";

interface Params {
  params: Promise<{ id: string }>; // photoId
}

// PUT /api/fotos/[id] - Editar preço e status da foto
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
      return NextResponse.json({ message: "Foto não encontrada." }, { status: 404 });
    }

    assertOwnership(user.id, photo.album.photographerId);

    const validatedData = photoSchema.parse(body);

    const updatedPhoto = await prisma.photo.update({
      where: { id: photoId },
      data: {
        price: Math.round(validatedData.price * 100), // Reais para centavos
        status: validatedData.status,
      },
    });

    return NextResponse.json(updatedPhoto);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { message: "Dados inválidos.", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: error.message || "Erro ao atualizar foto." },
      { status: 500 }
    );
  }
}

// DELETE /api/fotos/[id] - Excluir foto permanentemente
export async function DELETE(request: Request, { params }: Params) {
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
      return NextResponse.json({ message: "Foto não encontrada." }, { status: 404 });
    }

    assertOwnership(user.id, photo.album.photographerId);

    // 1. Remove do R2
    try {
      await deletePreviewFromR2(photo.previewR2Key);
    } catch (e) {
      console.error("Falha ao apagar do R2:", e);
    }

    // 2. Remove do Google Drive
    try {
      await deleteFromDrive(photo.driveFileId);
    } catch (e) {
      console.error("Falha ao apagar do Drive:", e);
    }

    // 3. Remove do Banco
    await prisma.photo.delete({
      where: { id: photoId },
    });

    return NextResponse.json({ message: "Foto deletada com sucesso." });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Erro ao deletar foto." },
      { status: 500 }
    );
  }
}
