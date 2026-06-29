import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getMetadataPhone } from "@/lib/user-metadata";

/**
 * Returns the authenticated user synced with Prisma, or null when there is no
 * session. Public pages should not crash because of stale cookies or auth sync
 * failures.
 */
export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser().catch((error) => {
    console.error("Erro ao buscar usuario Supabase:", error);
    return { data: { user: null } };
  });

  if (!supabaseUser) return null;

  const name =
    supabaseUser.user_metadata?.full_name ||
    supabaseUser.user_metadata?.name ||
    supabaseUser.email?.split("@")[0] ||
    "Fotografo";
  const phone = getMetadataPhone(supabaseUser.user_metadata);

  const user = await prisma.user
    .upsert({
      where: { supabaseUserId: supabaseUser.id },
      update: {
        name,
        avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
        ...(phone ? { phone } : {}),
      },
      create: {
        supabaseUserId: supabaseUser.id,
        name,
        email: supabaseUser.email!,
        avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
        phone,
        role: "BUYER",
      },
    })
    .catch((error) => {
      console.error("Erro ao sincronizar usuario autenticado:", error);
      return null;
    });

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Nao autenticado");
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
