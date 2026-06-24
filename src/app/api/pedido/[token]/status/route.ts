import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const order = await prisma.order.findUnique({
      where: { accessToken: token },
      select: {
        status: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: order.status });
  } catch (error) {
    console.error("Erro ao verificar status do pedido:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
