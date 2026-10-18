import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePhotographer } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePhotographer();
    const { id } = await params;
    const album = await prisma.album.findUnique({ where: { id }, select: { photographerId: true } });
    if (!album || album.photographerId !== user.id) return NextResponse.json({ message: "Álbum não encontrado." }, { status: 404 });
    const { price } = await request.json();
    if (typeof price !== "number" || !Number.isFinite(price) || price < 0 || price > 100000) {
      return NextResponse.json({ message: "Preço inválido." }, { status: 400 });
    }
    const updated = await prisma.album.update({ where: { id }, data: { defaultVideoPrice: Math.round(price * 100) }, select: { defaultVideoPrice: true } });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ message: "Não foi possível salvar o preço." }, { status: 500 });
  }
}
