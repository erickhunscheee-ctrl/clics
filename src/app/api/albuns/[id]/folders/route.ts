import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePhotographer } from "@/lib/auth";
import { assertOwnership } from "@/lib/permissions";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requirePhotographer();
    const { id } = await params;

    const album = await prisma.album.findUnique({
      where: { id },
      select: { photographerId: true },
    });

    if (!album) {
      return NextResponse.json({ message: "Album nao encontrado." }, { status: 404 });
    }

    assertOwnership(user.id, album.photographerId);

    const folders = await prisma.albumFolder.findMany({
      where: { albumId: id },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { photos: true } } },
    });

    return NextResponse.json(folders);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao carregar pastas.";

    return NextResponse.json(
      { message },
      { status: message === "Nao autenticado" ? 401 : 403 }
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requirePhotographer();
    const { id } = await params;
    const { name } = await request.json();
    const folderName = typeof name === "string" ? name.trim() : "";

    if (folderName.length < 2 || folderName.length > 80) {
      return NextResponse.json(
        { message: "Informe um nome de pasta entre 2 e 80 caracteres." },
        { status: 400 }
      );
    }

    const album = await prisma.album.findUnique({
      where: { id },
      select: { photographerId: true },
    });

    if (!album) {
      return NextResponse.json({ message: "Album nao encontrado." }, { status: 404 });
    }

    assertOwnership(user.id, album.photographerId);

    const folder = await prisma.albumFolder.create({
      data: {
        albumId: id,
        name: folderName,
      },
      include: { _count: { select: { photos: true } } },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao criar pasta.";

    return NextResponse.json(
      { message: message.includes("Unique constraint") ? "Ja existe uma pasta com esse nome." : message },
      { status: message === "Nao autenticado" ? 401 : 400 }
    );
  }
}
