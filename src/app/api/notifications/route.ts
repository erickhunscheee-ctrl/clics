import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePhotographer } from "@/lib/auth";

// GET /api/notifications — Lista notificações mais recentes (público no dashboard)
export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json(notifications);
  } catch {
    return NextResponse.json(
      { message: "Erro ao carregar notificações." },
      { status: 500 }
    );
  }
}

// POST /api/notifications — Cria nova notificação (admin only)
export async function POST(request: Request) {
  try {
    await requirePhotographer();

    const body = await request.json();
    const { subject, description, imageUrl } = body as {
      subject?: string;
      description?: string;
      imageUrl?: string;
    };

    if (!subject?.trim() || !description?.trim()) {
      return NextResponse.json(
        { message: "Assunto e descrição são obrigatórios." },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        subject: subject.trim(),
        description: description.trim(),
        imageUrl: imageUrl?.trim() || null,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar notificação.";
    return NextResponse.json(
      { message },
      { status: message.includes("autenticado") || message.includes("restrito") ? 401 : 500 }
    );
  }
}
