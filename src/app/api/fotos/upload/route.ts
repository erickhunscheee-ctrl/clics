import { NextResponse } from "next/server";
import { requirePhotographer } from "@/lib/auth";
import { generatePresignedUploadUrl } from "@/lib/r2";
import { v4 as uuidv4 } from "uuid";

// POST /api/fotos/upload
// Recebe metadados (fileName, contentType) e gera presigned URL do R2 para upload direto do browser.
export async function POST(request: Request) {
  try {
    await requirePhotographer();
    const { fileName, contentType } = await request.json();

    if (!fileName || !contentType) {
      return NextResponse.json({ message: "Dados do arquivo incompletos." }, { status: 400 });
    }

    const uniqueId = uuidv4();
    const fileExtension = fileName.split(".").pop();
    const tempKey = `temp/${uniqueId}.${fileExtension}`;

    // Gera a URL assinada de PUT para o R2 (válida por 15 minutos)
    const uploadUrl = await generatePresignedUploadUrl(tempKey, contentType);

    return NextResponse.json({
      uploadUrl,
      tempKey,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Erro ao gerar URL de upload." },
      { status: error.message === "Não autenticado" ? 401 : 500 }
    );
  }
}
