"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingBag,
  X,
} from "lucide-react";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: "Visão geral", href: "/dashboard", icon: LayoutDashboard },
    { label: "Meus álbuns", href: "/dashboard/albuns", icon: FolderKanban },
    { label: "Vendas e pedidos", href: "/dashboard/pedidos", icon: ShoppingBag },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-white/10 bg-[#061337]/90 p-2 text-white shadow-[0_12px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-colors hover:border-[#159BEF]/40 lg:hidden"
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col justify-between border-r border-white/10 bg-[#101827] transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="flex h-24 items-center border-b border-white/10 px-6">
            <div className="min-w-0">
              <Image
                src="/logo_clics_branco.png"
                alt="CLICS"
                width={148}
                height={54}
                className="h-auto w-32 object-contain"
                priority
              />
              <p className="mt-2 text-[10px] font-medium uppercase text-white/45">
                Área do fotógrafo
              </p>
            </div>
          </div>

          <nav aria-label="Painel do fotógrafo" className="space-y-1 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? "border-[#159BEF]/30 bg-white/10 text-white"
                      : "border-transparent text-white/58 hover:border-white/10 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                      isActive
                        ? "bg-sky-700 text-white"
                        : "bg-white/5 text-white/60"
                    }`}
                  >
                    <Icon size={16} />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link href="/" className="mx-4 flex min-h-11 items-center rounded-lg px-4 text-sm text-white/60 hover:bg-white/5 hover:text-white">← Ver álbuns publicados</Link>
        </div>

        <div className="space-y-4 border-t border-white/10 p-4">
          {/* Notificações */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase text-white/30 tracking-widest">
              Notificações
            </span>
            <NotificationsDropdown />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-11 w-11 rounded-lg border border-white/10 object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-700 text-sm font-black text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                <p className="truncate text-xs text-white/45">{user.email}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg border border-transparent px-4 py-3 text-sm font-medium text-red-300 transition-all hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-200"
          >
            <LogOut size={18} />
            Sair da Conta
          </button>
        </div>
      </aside>
    </>
  );
}
