import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePhotographer } from "@/lib/auth";
import { assertOwnership } from "@/lib/permissions";
import { batchMoveSchema } from "@/lib/validators/photo";

// PUT /api/fotos/batch/move - Mover fotos em lote para uma pasta
export async function PUT(request: Request) {
  try {
    const user = await requirePhotographer();
    const body = await request.json();

    const validatedData = batchMoveSchema.parse(body);

    if (validatedData.photoIds.length === 0) {
      return NextResponse.json({ message: "Nenhuma foto selecionada." }, { status: 400 });
    }

    // Busca as fotos para validar se pertencem a álbuns do fotógrafo
    const photos = await prisma.photo.findMany({
      where: {
        id: { in: validatedData.photoIds },
      },
      include: {
        album: {
          select: { photographerId: true },
        },
      },
    });

    // Valida permissão para cada foto
    for (const photo of photos) {
      assertOwnership(user.id, photo.album.photographerId);
    }

    // Se estiver movendo para uma pasta específica (não nula), verifica se a pasta pertence ao álbum (opcional mas recomendado)
    // Para simplificar, assumiremos que a UI envia o folderId correto do próprio álbum
    // Mas seria bom verificar se a pasta existe e pertence ao álbum do usuário.
    if (validatedData.folderId) {
      const folder = await prisma.albumFolder.findUnique({
        where: { id: validatedData.folderId },
        include: { album: true }
      });
      if (folder) {
        assertOwnership(user.id, folder.album.photographerId);
      }
    }

    // Atualiza o folderId em lote no banco
    await prisma.photo.updateMany({
      where: {
        id: { in: validatedData.photoIds },
      },
      data: {
        folderId: validatedData.folderId,
      },
    });

    return NextResponse.json({ success: true, message: "Fotos movidas com sucesso." });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { message: "Dados inválidos.", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: error.message || "Erro ao mover fotos em lote." },
      { status: 500 }
    );
  }
}
