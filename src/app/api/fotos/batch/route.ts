import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePhotographer } from "@/lib/auth";
import { assertOwnership } from "@/lib/permissions";
import { batchPriceSchema } from "@/lib/validators/photo";

// PUT /api/fotos/batch - Atualizar preços de fotos em lote
export async function PUT(request: Request) {
  try {
    const user = await requirePhotographer();
    const body = await request.json();

    const validatedData = batchPriceSchema.parse(body);

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

    // Atualiza os preços em lote no banco
    await prisma.photo.updateMany({
      where: {
        id: { in: validatedData.photoIds },
      },
      data: {
        price: Math.round(validatedData.price * 100), // Converte Reais para centavos
      },
    });

    return NextResponse.json({ success: true, message: "Preços atualizados com sucesso." });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { message: "Dados inválidos.", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: error.message || "Erro ao atualizar preços em lote." },
      { status: 500 }
    );
  }
}
