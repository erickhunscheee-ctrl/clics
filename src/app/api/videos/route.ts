import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePhotographer } from "@/lib/auth";
import { generatePresignedUploadUrl } from "@/lib/r2";
import { randomUUID } from "node:crypto";

export async function POST(request: Request) {
  try {
    const user = await requirePhotographer();
    const { albumId, fileName, contentType, fileSize } = await request.json();
    if (typeof albumId !== "string" || typeof fileName !== "string" ||
        !["video/mp4", "video/quicktime", "video/webm"].includes(contentType) ||
        !Number.isSafeInteger(fileSize) || fileSize < 1 || fileSize > 500 * 1024 * 1024) {
      return NextResponse.json({ message: "Envie um vídeo MP4, MOV ou WebM de até 500 MB." }, { status: 400 });
    }
    const album = await prisma.album.findUnique({ where: { id: albumId }, select: { photographerId: true } });
    if (!album || album.photographerId !== user.id) return NextResponse.json({ message: "Álbum não encontrado." }, { status: 404 });
    const key = `videos/${albumId}/originals/${randomUUID()}`;
    const uploadUrl = await generatePresignedUploadUrl(key, contentType, 900);
    return NextResponse.json({ key, uploadUrl });
  } catch {
    return NextResponse.json({ message: "Não foi possível iniciar o upload." }, { status: 500 });
  }
}
