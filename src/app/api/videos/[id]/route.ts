import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePhotographer } from "@/lib/auth";
import { deletePreviewFromR2 } from "@/lib/r2";
import { deleteFromDrive } from "@/lib/google-drive";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const user = await requirePhotographer();
    const { id } = await params;
    const video = await prisma.video.findUnique({ where: { id }, include: { album: { select: { photographerId: true } } } });
    if (!video || video.album.photographerId !== user.id) return NextResponse.json({ message: "Vídeo não encontrado." }, { status: 404 });
    const body = await request.json();
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0 || price > 100000 || !["ACTIVE", "HIDDEN"].includes(body.status)) {
      return NextResponse.json({ message: "Preço ou status inválido." }, { status: 400 });
    }
    const updated = await prisma.video.update({ where: { id }, data: { price: Math.round(price * 100), status: body.status } });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ message: "Não foi possível atualizar o vídeo." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const user = await requirePhotographer();
    const { id } = await params;
    const video = await prisma.video.findUnique({ where: { id }, include: { album: { select: { photographerId: true } }, _count: { select: { orderItems: true } } } });
    if (!video || video.album.photographerId !== user.id) return NextResponse.json({ message: "Vídeo não encontrado." }, { status: 404 });
    if (video._count.orderItems) return NextResponse.json({ message: "Vídeo já vendido. Oculte-o para preservar os pedidos." }, { status: 409 });
    await prisma.video.delete({ where: { id } });
    await deletePreviewFromR2(video.previewR2Key).catch(() => {});
    await deletePreviewFromR2(video.originalR2Key).catch(() => {});
    if (video.driveFileId) await deleteFromDrive(video.driveFileId).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Não foi possível excluir o vídeo." }, { status: 500 });
  }
}
