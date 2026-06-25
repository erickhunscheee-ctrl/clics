import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Get the current authenticated user from Supabase and find their Prisma User record
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser) return null;

  // Busca ou cria o usuário na base de dados para manter sincronizado resiliente a falhas
  const user = await prisma.user.upsert({
    where: { supabaseUserId: supabaseUser.id },
    update: {
      name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "Fotógrafo",
      avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
    },
    create: {
      supabaseUserId: supabaseUser.id,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "Fotógrafo",
      email: supabaseUser.email!,
      avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
      role: "BUYER",
    },
  });

  return user;
}

/**
 * Require authenticated user — throws if not logged in
 */
export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Não autenticado");
  }

  return user;
}

export function getAdminEmails() {
  return [process.env.ADMIN_EMAIL, process.env.NEXT_PUBLIC_ADMIN_EMAIL]
    .filter((email): email is string => Boolean(email))
    .map((email) => email.trim().toLowerCase());
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;

  const adminEmails = getAdminEmails();

  if (adminEmails.length === 0) return false;

  return adminEmails.includes(email.trim().toLowerCase());
}

export async function requirePhotographer() {
  const user = await requireUser();

  if (!isAdminEmail(user.email)) {
    throw new Error("Acesso restrito ao administrador");
  }

  return user;
}
