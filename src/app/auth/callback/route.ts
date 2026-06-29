import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getMetadataPhone } from "@/lib/user-metadata";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Erro no exchangeCodeForSession do Supabase:", error);
        throw error;
      }

      if (data?.user) {
        const supabaseUser = data.user;
        const phone = getMetadataPhone(supabaseUser.user_metadata);

        // Sincroniza o usuário com o banco de dados via Prisma
        await prisma.user.upsert({
          where: { supabaseUserId: supabaseUser.id },
          update: {
            name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "Fotógrafo",
            avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
            ...(phone ? { phone } : {}),
            role: "BUYER",
          },
          create: {
            supabaseUserId: supabaseUser.id,
            name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "Fotógrafo",
            email: supabaseUser.email!,
            avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
            phone,
            role: "BUYER",
          },
        });

        const baseUrl = process.env.APP_URL || origin;
        return NextResponse.redirect(`${baseUrl}${next}`);
      }
    } catch (e) {
      console.error("Erro fatal no callback de autenticacao:", e);
    }
  }

  // Retorna o usuário para uma página de erro se algo falhar
  const baseUrl = process.env.APP_URL || origin;
  return NextResponse.redirect(`${baseUrl}/login?error=auth-callback-failed`);
}
