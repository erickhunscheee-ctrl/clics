import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDriveFileStream } from "@/lib/google-drive";
import { Readable } from "stream";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { message: "Token de acesso não fornecido." },
        { status: 401 }
      );
    }

    // 1. Busca o pedido pelo token
    const order = await prisma.order.findUnique({
      where: { accessToken: token },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    // 2. Valida o status do pedido
    if (order.status !== "PAID") {
      return NextResponse.json(
        { message: "O download só é permitido após a aprovação do pagamento." },
        { status: 403 }
      );
    }

    // 3. Valida a validade do token (30 dias)
    const isExpired = new Date() > order.accessTokenExpiresAt;
    if (isExpired) {
      return NextResponse.json(
        { message: "O link de acesso para download expirou (limite de 30 dias)." },
        { status: 410 }
      );
    }

    // 4. Verifica se a foto pertence ao pedido
    const orderItem = order.items.find((item) => item.photoId === photoId);
    if (!orderItem) {
      return NextResponse.json(
        { message: "Esta foto não pertence a este pedido." },
        { status: 403 }
      );
    }

    // 5. Busca as informações da foto original no banco de dados
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      return NextResponse.json(
        { message: "Foto não encontrada." },
        { status: 404 }
      );
    }

    // 6. Obtém o stream do arquivo original do Google Drive
    const nodeStream = await getDriveFileStream(photo.driveFileId);

    // 7. Incrementa o contador de downloads de forma assíncrona
    await prisma.orderItem.update({
      where: {
        orderId_photoId: {
          orderId: order.id,
          photoId: photoId,
        },
      },
      data: {
        downloadCount: { increment: 1 },
        lastDownloadedAt: new Date(),
      },
    });

    // 8. Converte o Readable stream do Node em Web ReadableStream
    // @ts-ignore
    const webStream = Readable.toWeb(nodeStream);

    // 9. Retorna o stream do arquivo com os cabeçalhos apropriados
    return new Response(webStream as any, {
      headers: {
        "Content-Type": photo.originalMimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          photo.originalFileName
        )}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Erro ao realizar o download da foto:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor ao iniciar o download." },
      { status: 500 }
    );
  }
}
