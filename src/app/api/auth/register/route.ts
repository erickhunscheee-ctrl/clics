import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { supabaseUserId, name, email, role } = await request.json();

    if (!supabaseUserId || !email || !name) {
      return NextResponse.json(
        { message: "Dados incompletos para registro do usuario." },
        { status: 400 }
      );
    }

    const userRole = role === "PHOTOGRAPHER" ? "PHOTOGRAPHER" : "BUYER";

    const user = await prisma.user.upsert({
      where: { supabaseUserId },
      update: {
        name,
        email,
        role: userRole,
      },
      create: {
        supabaseUserId,
        name,
        email,
        role: userRole,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Erro na API de Registro:", error);
    return NextResponse.json(
      {
        message: "Erro interno do servidor.",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
