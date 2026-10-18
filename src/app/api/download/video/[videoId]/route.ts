import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePresignedDownloadUrl } from "@/lib/r2";

export async function GET(request: Request, { params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return NextResponse.json({ message: "Token não fornecido." }, { status: 401 });
  const order = await prisma.order.findUnique({ where: { accessToken: token }, select: { id: true, status: true, accessTokenExpiresAt: true, items: { where: { videoId }, select: { id: true } } } });
  if (!order || !order.items.length || order.status !== "PAID" || order.accessTokenExpiresAt < new Date()) {
    return NextResponse.json({ message: "Download não autorizado." }, { status: 403 });
  }
  const video = await prisma.video.findUnique({ where: { id: videoId }, select: { originalR2Key: true, originalFileName: true } });
  if (!video) return NextResponse.json({ message: "Vídeo não encontrado." }, { status: 404 });
  await prisma.orderItem.update({ where: { id: order.items[0].id }, data: { downloadCount: { increment: 1 }, lastDownloadedAt: new Date() } });
  return NextResponse.redirect(await generatePresignedDownloadUrl(video.originalR2Key, 60, video.originalFileName));
}
