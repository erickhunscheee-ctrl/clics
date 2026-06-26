import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePhotographer } from "@/lib/auth";
import { assertOwnership } from "@/lib/permissions";
import { uploadPreviewToR2 } from "@/lib/r2";
import { uploadOriginalToDrive } from "@/lib/google-drive";
import { generatePhotoPreview } from "@/lib/image-preview";
import { v4 as uuidv4 } from "uuid";

interface Params {
  params: Promise<{ id: string }>; // albumId
}

// POST /api/fotos/[id]/process (onde [id] é o albumId)
// Recebe a foto diretamente via multipart/form-data, comprime com Sharp,
// salva o preview comprimido no R2 e o original no Google Drive.
export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requirePhotographer();
    const albumId = (await params).id;

    // Recebe o arquivo via multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const album = await prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      return NextResponse.json({ message: "Álbum não encontrado." }, { status: 404 });
    }

    assertOwnership(user.id, album.photographerId);

    // 1. Converte o arquivo para Buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Aloca um novo Buffer padrão do Node.js e copia os bytes.
    // Isso garante 100% que não estamos repassando um SharedArrayBuffer
    // (que pode falhar na verificação cross-realm com instanceof)
    const uint8Array = new Uint8Array(arrayBuffer);
    const originalBuffer = Buffer.alloc(uint8Array.length);
    originalBuffer.set(uint8Array);

    const originalFileName = file.name;
    const originalMimeType = file.type;

    // 2. Comprime e gera o preview WebP com Sharp (antes de enviar para o R2)
    const previewResult = await generatePhotoPreview(originalBuffer, {
      maxWidth: 1200,
      quality: 80,
      enableWatermark: true,
    });

    // 3. Envia o preview comprimido para o Cloudflare R2
    const previewKey = `previews/${album.id}/${uuidv4()}_preview.webp`;
    const previewUrl = await uploadPreviewToR2(
      previewResult.buffer,
      previewKey,
      previewResult.contentType
    );

    // 4. Envia o arquivo original (sem compressão) para o Google Drive como backup
    const driveFileId = await uploadOriginalToDrive(
      originalBuffer,
      originalFileName,
      originalMimeType,
      album.id,
      album.title
    );

    // 5. Salva as informações da foto no banco de dados
    const photo = await prisma.photo.create({
      data: {
        albumId: album.id,
        originalFileName,
        originalMimeType,
        driveFileId,
        previewR2Key: previewKey,
        previewUrl,
        price: album.defaultPhotoPrice,
        width: previewResult.width,
        height: previewResult.height,
        fileSize: originalBuffer.length,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error: unknown) {
    console.error("Erro no processamento da foto:", error);
    const message = error instanceof Error ? error.message : "Erro no processamento da foto.";

    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
