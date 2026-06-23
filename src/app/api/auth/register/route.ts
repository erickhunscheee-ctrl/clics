import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { supabaseUserId, name, email } = await request.json();

    if (!supabaseUserId || !email || !name) {
      return NextResponse.json(
        { message: "Dados incompletos para registro do usuário." },
        { status: 400 }
      );
    }

    // Cria ou atualiza o usuário no banco de dados local via Prisma
    const user = await prisma.user.upsert({
      where: { supabaseUserId },
      update: {
        name,
        email,
      },
      create: {
        supabaseUserId,
        name,
        email,
        role: "PHOTOGRAPHER",
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Erro na API de Registro:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor.", error: error.message },
      { status: 500 }
    );
  }
}
