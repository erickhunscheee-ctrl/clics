import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requirePhotographer } from "@/lib/auth";
import { deletePreviewFromR2, generatePresignedDownloadUrl, getObjectSizeInR2, getObjectStreamFromR2, uploadPreviewToR2 } from "@/lib/r2";
import { deleteFromDrive, uploadVideoStreamToDrive } from "@/lib/google-drive";

export const maxDuration = 900;

function makePreview(input: string, output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const logo = path.join(process.cwd(), "public", "logo_clics_branco.png");
    const filter = "[0:v]scale=w=1280:h=720:force_original_aspect_ratio=decrease,drawbox=x=(iw-420)/2:y=(ih-150)/2:w=420:h=150:color=black@0.28:t=fill[base];[1:v]scale=360:-1,colorchannelmixer=aa=0.75[mark];[base][mark]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2";
    const child = spawn("ffmpeg", ["-nostdin", "-y", "-i", input, "-loop", "1", "-i", logo, "-t", "20", "-filter_complex", filter, "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-movflags", "+faststart", output], { stdio: "ignore" });
    const timer = setTimeout(() => child.kill(), 240000);
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code) => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error("Falha ao gerar prévia do vídeo.")); });
  });
}

export async function POST(request: Request) {
  let dir: string | undefined;
  let previewKey: string | undefined;
  let driveFileId: string | undefined;
  try {
    const user = await requirePhotographer();
    const { albumId, key, fileName, contentType } = await request.json();
    if (typeof albumId !== "string" || !/^c[a-z0-9]{20,}$/.test(albumId) || typeof key !== "string" || !key.startsWith(`videos/${albumId}/originals/`) || !/^[0-9a-f-]{36}$/.test(key.slice(`videos/${albumId}/originals/`.length)) ||
        typeof fileName !== "string" || fileName.length > 255 || !["video/mp4", "video/quicktime", "video/webm"].includes(contentType)) {
      return NextResponse.json({ message: "Dados do vídeo inválidos." }, { status: 400 });
    }
    const album = await prisma.album.findUnique({ where: { id: albumId }, select: { photographerId: true, title: true, defaultVideoPrice: true } });
    if (!album || album.photographerId !== user.id) return NextResponse.json({ message: "Álbum não encontrado." }, { status: 404 });
    if (await prisma.video.findUnique({ where: { originalR2Key: key }, select: { id: true } })) return NextResponse.json({ message: "Este vídeo já foi processado." }, { status: 409 });
    const fileSize = await getObjectSizeInR2(key);
    if (!fileSize || fileSize > 500 * 1024 * 1024) return NextResponse.json({ message: "Upload incompleto ou arquivo maior que 500 MB." }, { status: 400 });
    dir = await mkdtemp(path.join(tmpdir(), "clics-video-"));
    const output = path.join(dir, "preview.mp4");
    await makePreview(await generatePresignedDownloadUrl(key, 300), output);
    previewKey = `videos/${albumId}/previews/${randomUUID()}.mp4`;
    const previewUrl = await uploadPreviewToR2(await readFile(output), previewKey, "video/mp4");
    driveFileId = await uploadVideoStreamToDrive(await getObjectStreamFromR2(key), fileName, contentType, albumId, album.title);
    const video = await prisma.video.create({ data: { albumId, originalFileName: fileName, originalMimeType: contentType, originalR2Key: key, driveFileId, previewR2Key: previewKey, previewUrl, price: album.defaultVideoPrice } });
    await deletePreviewFromR2(key).catch((error) => console.error("Falha ao remover vídeo temporário do R2:", error));
    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    if (previewKey) await deletePreviewFromR2(previewKey).catch(() => {});
    if (driveFileId) await deleteFromDrive(driveFileId).catch(() => {});
    console.error("Erro no processamento do vídeo:", error);
    return NextResponse.json({ message: "Não foi possível processar o vídeo ou salvá-lo no Drive. Tente novamente." }, { status: 500 });
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
