import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePhotographer } from "@/lib/auth";
import { generateUniqueSlug } from "@/lib/slug";
import { albumSchema } from "@/lib/validators/album";
import { percentToBps } from "@/lib/promotions";
import { ZodError } from "zod";

// GET /api/albuns - Listar álbuns do fotógrafo autenticado
export async function GET() {
  try {
    const user = await requirePhotographer();
    const albums = await prisma.album.findMany({
      where: { photographerId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { photos: true },
        },
      },
    });

    return NextResponse.json(albums);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao carregar albuns.";
    return NextResponse.json(
      { message },
      { status: message === "Não autenticado" ? 401 : 500 }
    );
  }
}

// POST /api/albuns - Criar novo álbum
export async function POST(request: Request) {
  try {
    const user = await requirePhotographer();
    
    // Restringe a criação de álbuns ao administrador / email permitido
    const body = await request.json();

    // Valida os dados de entrada usando Zod
    const validatedData = albumSchema.parse(body);

    // Gera um slug único a partir do título do álbum
    const slug = await generateUniqueSlug(validatedData.title);

    // Cria o álbum no banco de dados
    const album = await prisma.album.create({
      data: {
        photographerId: user.id,
        title: validatedData.title,
        slug,
        description: validatedData.description,
        eventDate: validatedData.eventDate ? new Date(validatedData.eventDate) : null,
        location: validatedData.location,
        defaultPhotoPrice: Math.round(validatedData.defaultPhotoPrice * 100), // Converte Reais para centavos
        promotionEnabled: validatedData.promotionEnabled,
        promotionMinPhotos: validatedData.promotionMinPhotos,
        promotionDiscountBps: percentToBps(validatedData.promotionDiscountPercent),
        status: "DRAFT",
      },
    });

    return NextResponse.json(album, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Dados inválidos.", errors: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Erro ao criar album.";
    return NextResponse.json(
      { message },
      { status: message === "Não autenticado" ? 401 : 500 }
    );
  }
}
