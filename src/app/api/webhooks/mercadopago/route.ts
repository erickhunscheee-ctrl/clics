import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentDetails, mapPaymentStatus } from "@/lib/mercadopago";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    // Notificações do Mercado Pago podem vir por query param (topic + id) ou no body (action + data.id)
    const type = searchParams.get("type") || body.type;
    const action = searchParams.get("action") || body.action;
    
    let paymentId = "";

    if (type === "payment" || action === "payment.created" || action === "payment.updated") {
      paymentId = searchParams.get("data.id") || body.data?.id || searchParams.get("id") || body.id;
    }

    // Registra a notificação em log geral para depuração
    await prisma.paymentLog.create({
      data: {
        eventType: action || type || "unknown",
        externalId: paymentId || null,
        payload: {
          query: Object.fromEntries(searchParams.entries()),
          body,
        },
      },
    });

    if (!paymentId) {
      // Retorna 200 mesmo sem ID para evitar re-tentativas desnecessárias do MP em notificações irrelevantes
      return NextResponse.json({ message: "Notificação recebida, mas nenhum ID de pagamento encontrado." }, { status: 200 });
    }

    // 1. Busca os detalhes reais do pagamento direto da API do Mercado Pago
    const paymentDetails = await getPaymentDetails(paymentId);
    if (!paymentDetails || !paymentDetails.externalReference) {
      console.warn(`Detalhes do pagamento ${paymentId} não encontrados ou sem referência externa.`);
      return NextResponse.json({ message: "Referência externa não encontrada no pagamento." }, { status: 200 });
    }

    const orderId = paymentDetails.externalReference;

    // 2. Busca o pedido correspondente no banco
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      console.warn(`Pedido correspondente ao pagamento ${paymentId} (ID: ${orderId}) não encontrado.`);
      return NextResponse.json({ message: "Pedido correspondente não encontrado." }, { status: 200 });
    }

    // Mapeia o status do Mercado Pago para o status da nossa plataforma
    const nextStatus = mapPaymentStatus(paymentDetails.status || "");

    // 3. Atualiza o status do pedido e vincula o ID do pagamento no MP
    await prisma.$transaction(async (tx) => {
      // Atualiza o pedido
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: nextStatus,
          mercadoPagoPaymentId: paymentId,
        },
      });

      // Cria log específico atrelado ao pedido
      await tx.paymentLog.create({
        data: {
          orderId: order.id,
          eventType: `order_status_update_${nextStatus}`,
          externalId: paymentId,
          payload: { paymentDetails },
        },
      });
    });

    return NextResponse.json({ success: true, statusUpdatedTo: nextStatus }, { status: 200 });
  } catch (error: any) {
    console.error("Erro no processamento do webhook do Mercado Pago:", error);
    return NextResponse.json({ message: "Erro interno ao processar notificação." }, { status: 500 });
  }
}
