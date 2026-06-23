import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateUniqueSlug } from "@/lib/slug";
import { albumSchema } from "@/lib/validators/album";

// GET /api/albuns - Listar álbuns do fotógrafo autenticado
export async function GET() {
  try {
    const user = await requireUser();
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
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Erro ao carregar álbuns." },
      { status: error.message === "Não autenticado" ? 401 : 500 }
    );
  }
}

// POST /api/albuns - Criar novo álbum
export async function POST(request: Request) {
  try {
    const user = await requireUser();
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
        status: "DRAFT",
      },
    });

    return NextResponse.json(album, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { message: "Dados inválidos.", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: error.message || "Erro ao criar álbum." },
      { status: error.message === "Não autenticado" ? 401 : 500 }
    );
  }
}
