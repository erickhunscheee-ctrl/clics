import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validators/checkout";
import { processTransparentPayment, mapPaymentStatus } from "@/lib/mercadopago";
import { generateAccessToken } from "@/lib/tokens";
import { requireUser } from "@/lib/auth";
import { calculatePromotionTotal } from "@/lib/promotions";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    
    // Validação com Zod
    const parsedData = checkoutSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json(
        { message: "Dados inválidos.", errors: parsedData.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { 
      albumId, 
      photoIds, 
      customerPhone, 
      customerDocument, 
      paymentMethod,
      cardToken,
      installments,
      paymentMethodId,
      issuerId
    } = parsedData.data;
    const customerName = user.name || user.email.split("@")[0];
    const customerEmail = user.email;

    if (photoIds.length === 0) {
      return NextResponse.json(
        { message: "Selecione pelo menos uma foto para realizar a compra." },
        { status: 400 }
      );
    }

    // Busca o álbum
    if (paymentMethod === "CREDIT_CARD") {
      const cleanDocument = customerDocument?.replace(/\D/g, "") ?? "";

      if (!cardToken || !paymentMethodId || !installments || cleanDocument.length !== 11) {
        return NextResponse.json(
          { message: "Dados do cartao incompletos ou invalidos." },
          { status: 400 }
        );
      }
    }

    const album = await prisma.album.findUnique({
      where: { id: albumId, status: "PUBLISHED" },
    });

    if (!album) {
      return NextResponse.json(
        { message: "Álbum não encontrado ou não está publicado." },
        { status: 404 }
      );
    }

    // Busca as fotos no banco de dados para garantir preço e existência corretos
    const photos = await prisma.photo.findMany({
      where: {
        id: { in: photoIds },
        albumId: albumId,
        status: "ACTIVE",
      },
    });

    if (photos.length !== photoIds.length) {
      return NextResponse.json(
        { message: "Algumas das fotos selecionadas não estão disponíveis." },
        { status: 400 }
      );
    }

    // Calcula o total em centavos com a promocao vigente do album.
    const { totalAmount } = calculatePromotionTotal(
      photos.map((photo) => photo.price),
      album
    );

    // Gera um token de acesso para o pedido com validade de 30 dias
    const accessToken = generateAccessToken();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);

    // Cria a transação no banco de dados
    const order = await prisma.$transaction(async (tx) => {
      // Cria a ordem
      const newOrder = await tx.order.create({
        data: {
          albumId,
          customerName,
          customerEmail,
          customerPhone: customerPhone || "",
          customerDocument,
          status: "PENDING",
          totalAmount,
          accessToken,
          accessTokenExpiresAt: tokenExpiresAt,
        },
      });

      // Cria os itens da ordem
      await tx.orderItem.createMany({
        data: photos.map((photo) => ({
          orderId: newOrder.id,
          photoId: photo.id,
          price: photo.price,
        })),
      });

      return newOrder;
    });

    // Processa pagamento transparente
    const paymentResult = await processTransparentPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentMethod,
      transactionAmount: totalAmount / 100, // MP espera valor em Reais (com decimais)
      payer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone || "",
        document: customerDocument,
      },
      cardToken,
      installments,
      paymentMethodId,
      issuerId,
    });

    const mappedStatus = mapPaymentStatus(paymentResult.status || "pending");

    // Atualiza o pedido com os detalhes de pagamento retornados do Mercado Pago
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: mappedStatus,
        mercadoPagoPaymentId: paymentResult.id || null,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      accessToken: order.accessToken,
      status: updatedOrder.status,
      paymentStatus: paymentResult.status,
      paymentStatusDetail: paymentResult.statusDetail,
      pixCopiaECola: paymentResult.pixCopiaECola,
      pixQrCodeBase64: paymentResult.pixQrCodeBase64,
    });
  } catch (error) {
    console.error("Erro no processamento do checkout:", error);
    const message = error instanceof Error ? error.message : "";

    return NextResponse.json(
      {
        message:
          message === "Não autenticado"
            ? "Entre na sua conta para finalizar a compra."
            : "Erro interno do servidor ao processar o pagamento.",
      },
      { status: message === "Não autenticado" ? 401 : 500 }
    );
  }
}
