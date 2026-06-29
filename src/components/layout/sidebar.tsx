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
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Meus Albuns", href: "/dashboard/albuns", icon: FolderKanban },
    { label: "Vendas e Pedidos", href: "/dashboard/pedidos", icon: ShoppingBag },
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
        className="fixed left-4 top-4 z-50 rounded-2xl border border-white/10 bg-[#061337]/90 p-2 text-white shadow-[0_12px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-colors hover:border-[#159BEF]/40 lg:hidden"
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
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col justify-between border-r border-white/10 bg-[#061337]/92 shadow-[20px_0_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0 ${
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
              <p className="mt-2 text-[10px] font-bold uppercase text-white/45">
                Area do fotografo
              </p>
            </div>
          </div>

          <nav className="space-y-2 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition-all ${
                    isActive
                      ? "border-[#159BEF]/30 bg-white/10 text-white shadow-[0_12px_28px_rgba(21,155,239,0.12)]"
                      : "border-transparent text-white/58 hover:border-white/10 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                      isActive
                        ? "bg-[linear-gradient(135deg,#159BEF,#7B3FF2)] text-white"
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
        </div>

        <div className="space-y-4 border-t border-white/10 p-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-11 w-11 rounded-2xl border border-white/10 object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#159BEF,#7B3FF2)] text-sm font-black text-white">
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
            className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-bold text-red-300 transition-all hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-200"
          >
            <LogOut size={18} />
            Sair da Conta
          </button>
        </div>
      </aside>
    </>
  );
}
