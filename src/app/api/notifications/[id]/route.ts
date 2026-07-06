import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePhotographer } from "@/lib/auth";

// DELETE /api/notifications/[id] — Remove uma notificação (admin only)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePhotographer();
    const { id } = await params;

    await prisma.notification.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao excluir notificação.";
    return NextResponse.json(
      { message },
      { status: message.includes("autenticado") || message.includes("restrito") ? 401 : 500 }
    );
  }
}
