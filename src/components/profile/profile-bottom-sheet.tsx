"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  User,
  LogOut,
  ShoppingBag,
  Camera,
  PackageCheck,
  Download,
  CreditCard,
  ChevronRight,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/money";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  accessToken: string;
  createdAt: string;
  album: {
    title: string;
    slug: string;
    coverImageUrl: string | null;
  };
  _count: {
    items: number;
  };
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    PAID: { label: "Pago", bg: "#DCFCE7", color: "#15803D" },
    PENDING: { label: "Pendente", bg: "#FEF9C3", color: "#B45309" },
    FAILED: { label: "Falhou", bg: "#FEE2E2", color: "#B91C1C" },
    CANCELLED: { label: "Cancelado", bg: "#F1F5F9", color: "#64748B" },
    REFUNDED: { label: "Estornado", bg: "#F3E8FF", color: "#7C3AED" },
  };
  const s = map[status] ?? { label: status, bg: "#F1F5F9", color: "#64748B" };

  return (
    <span
      className="text-[9px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

export function ProfileBottomSheet() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [animateOpen, setAnimateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notAuthenticated, setNotAuthenticated] = useState(false);

  const showProfile = searchParams.get("profile") === "true";
  const activeTab =
    searchParams.get("profileTab") === "pedidos" ? "pedidos" : "perfil";

  // Animate in/out
  useEffect(() => {
    if (showProfile) {
      setIsOpen(true);
      const t = setTimeout(() => setAnimateOpen(true), 50);
      return () => clearTimeout(t);
    } else {
      setAnimateOpen(false);
      const t = setTimeout(() => setIsOpen(false), 300);
      return () => clearTimeout(t);
    }
  }, [showProfile]);

  // Fetch user data when sheet opens
  useEffect(() => {
    if (!showProfile) return;

    setLoading(true);
    setNotAuthenticated(false);

    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated === false) {
          setNotAuthenticated(true);
          setUser(null);
          setOrders([]);
        } else {
          setUser(data.user);
          setOrders(data.orders ?? []);
        }
      })
      .catch(() => {
        setNotAuthenticated(true);
      })
      .finally(() => setLoading(false));
  }, [showProfile]);

  const handleClose = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("profile");
    params.delete("profileTab");
    const query = params.toString();
    window.history.pushState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  };

  const updateProfileTab = (tab: "perfil" | "pedidos") => {
    const params = new URLSearchParams(window.location.search);
    params.set("profile", "true");
    if (tab === "pedidos") {
      params.set("profileTab", "pedidos");
    } else {
      params.delete("profileTab");
    }
    const query = params.toString();
    window.history.pushState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    handleClose();
    router.refresh();
  };

  if (!isOpen) return null;

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";

  const roleLabel =
    user?.role === "PHOTOGRAPHER"
      ? "Fotógrafo"
      : user?.role === "ADMIN"
      ? "Admin"
      : "Comprador";

  const roleGradient =
    user?.role === "PHOTOGRAPHER" || user?.role === "ADMIN"
      ? "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)"
      : "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)";

  const paidCount = orders.filter((o) => o.status === "PAID").length;

  return (
    <div className="fixed inset-0 z-[120] overflow-hidden flex items-end justify-center px-[10px]">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
          animateOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        data-loading-ignore="true"
        className={`relative w-full max-w-xl bg-[#F6F8FC] rounded-t-[2.5rem] shadow-[0_-8px_30px_rgba(6,19,55,0.15)] z-[130] flex flex-col h-[85vh] transition-transform duration-300 ease-out transform ${
          animateOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Pull Handle */}
        <div
          className="w-12 h-1 bg-slate-200 rounded-full mx-auto my-3.5 flex-shrink-0 cursor-pointer hover:bg-slate-300 transition-colors"
          onClick={handleClose}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <User size={20} className="text-[#159BEF]" />
            <h2
              className="text-lg font-black text-[#061337]"
              style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}
            >
              Meu Perfil
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-[#061337] transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <Loader2 size={28} className="animate-spin text-[#159BEF]" />
              <p className="text-sm text-slate-400">Carregando perfil...</p>
            </div>
          ) : notAuthenticated ? (
            /* ─── Not logged in state ─── */
            <div className="h-full flex flex-col items-center justify-center px-8 text-center gap-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #F0F9FF 100%)" }}
              >
                <User size={36} className="text-[#7B3FF2]" />
              </div>
              <div className="space-y-2">
                <h3
                  className="text-xl font-black text-[#061337]"
                  style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}
                >
                  Faça seu login
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Entre na sua conta para ver seu histórico de pedidos e gerenciar suas compras.
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Link
                  href="/login"
                  onClick={handleClose}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)" }}
                >
                  Entrar na conta <ArrowRight size={16} />
                </Link>
                <Link
                  href="/register"
                  onClick={handleClose}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-[#061337] border-2 border-slate-200 flex items-center justify-center gap-2 hover:border-slate-300 transition-colors bg-white"
                >
                  Criar conta grátis
                </Link>
              </div>
            </div>
          ) : (
            /* ─── Authenticated state ─── */
            <div className="pb-8">
              {/* Profile Hero Card */}
              <div className="mx-4 mt-4 bg-white rounded-3xl shadow-[0_2px_16px_rgba(6,19,55,0.07)] overflow-hidden">
                {/* Gradient top bar */}
                <div
                  className="h-1.5 w-full"
                  style={{ background: roleGradient }}
                />
                <div className="p-5 flex items-center gap-4">
                  {/* Avatar */}
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #159BEF 0%, #7B3FF2 100%)" }}
                    >
                      {initials}
                    </div>
                  )}
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-base font-black text-[#061337] truncate"
                      style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}
                    >
                      {user?.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
                    <div className="mt-2">
                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
                        style={{ background: roleGradient }}
                      >
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 border-t border-slate-100">
                  <div className="flex flex-col items-center py-4 border-r border-slate-100">
                    <p
                      className="text-2xl font-black text-[#061337]"
                      style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}
                    >
                      {orders.length}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Pedidos</p>
                  </div>
                  <div className="flex flex-col items-center py-4">
                    <p
                      className="text-2xl font-black text-[#061337]"
                      style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}
                    >
                      {paidCount}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Pagos</p>
                  </div>
                </div>
              </div>

              {/* iOS Segmented Control */}
              <div className="px-4 py-4">
                <div className="bg-slate-100/80 p-1 rounded-2xl flex relative w-full border border-slate-200/40">
                  {/* Sliding Pill */}
                  <div
                    className="absolute top-1 bottom-1 left-1 bg-white rounded-xl shadow-sm transition-all duration-300 ease-out"
                    style={{
                      width: "calc(50% - 4px)",
                      transform:
                        activeTab === "perfil"
                          ? "translateX(0)"
                          : "translateX(calc(100% + 4px))",
                    }}
                  />
                  <button
                    onClick={() => updateProfileTab("perfil")}
                    className={`flex-1 py-2 text-xs font-bold text-center z-10 transition-colors duration-200 flex items-center justify-center gap-1.5 ${
                      activeTab === "perfil"
                        ? "text-[#061337]"
                        : "text-slate-400 hover:text-[#061337]"
                    }`}
                  >
                    <User size={12} />
                    Conta
                  </button>
                  <button
                    onClick={() => updateProfileTab("pedidos")}
                    className={`flex-1 py-2 text-xs font-bold text-center z-10 transition-colors duration-200 flex items-center justify-center gap-1.5 ${
                      activeTab === "pedidos"
                        ? "text-[#061337]"
                        : "text-slate-400 hover:text-[#061337]"
                    }`}
                  >
                    <ShoppingBag size={12} />
                    Pedidos ({orders.length})
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === "perfil" ? (
                /* ─── Conta tab ─── */
                <div className="px-4 space-y-3">
                  {/* Quick actions */}
                  <div className="bg-white rounded-3xl shadow-[0_2px_16px_rgba(6,19,55,0.07)] overflow-hidden">
                    <Link
                      href="/usuario"
                      onClick={handleClose}
                      className="flex items-center gap-4 px-5 py-4 border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#EEF2FF" }}>
                        <PackageCheck size={16} className="text-[#7B3FF2]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#061337]">Ver meus pedidos</p>
                        <p className="text-[11px] text-slate-400">Acompanhe suas compras e downloads</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-300" />
                    </Link>

                    {(user?.role === "PHOTOGRAPHER" || user?.role === "ADMIN") && (
                      <Link
                        href="/dashboard"
                        onClick={handleClose}
                        className="flex items-center gap-4 px-5 py-4 border-b border-slate-50 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#F0F9FF" }}>
                          <Camera size={16} className="text-[#159BEF]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#061337]">Área do Fotógrafo</p>
                          <p className="text-[11px] text-slate-400">Gerencie seus álbuns e vendas</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-300" />
                      </Link>
                    )}

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-50">
                        <LogOut size={16} className="text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-bold text-red-500">Sair da conta</p>
                        <p className="text-[11px] text-slate-400">Encerrar sessão atual</p>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                /* ─── Pedidos tab ─── */
                <div className="px-4 space-y-3">
                  {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center gap-3 py-10">
                      <div className="h-14 w-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-300">
                        <ShoppingBag size={26} />
                      </div>
                      <h3 className="text-sm font-bold text-[#061337]">Nenhum pedido ainda</h3>
                      <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                        Quando você finalizar uma compra, seus pedidos aparecem aqui.
                      </p>
                      <Link
                        href="/"
                        onClick={handleClose}
                        className="mt-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white"
                        style={{ background: "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)" }}
                      >
                        Explorar álbuns
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-white rounded-3xl shadow-[0_2px_16px_rgba(6,19,55,0.07)] overflow-hidden"
                        >
                          <div className="flex gap-3 p-4">
                            {/* Album cover */}
                            <img
                              src={order.album.coverImageUrl || "/placeholder.jpg"}
                              alt={order.album.title}
                              className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border border-slate-100"
                            />
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  #{order.orderNumber.slice(-6).toUpperCase()}
                                </p>
                                <StatusBadge status={order.status} />
                              </div>
                              <h4
                                className="text-sm font-black text-[#061337] mt-1 truncate"
                                style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}
                              >
                                {order.album.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] text-slate-400">
                                  {order._count.items} foto{order._count.items !== 1 ? "s" : ""}
                                </span>
                                <span className="text-slate-200">·</span>
                                <span className="text-[11px] font-bold text-[#061337]">
                                  {formatCurrency(order.totalAmount)}
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* Action button */}
                          <div className="px-4 pb-4">
                            <Link
                              href={`/pedido/${order.accessToken}`}
                              onClick={handleClose}
                              className="w-full py-2.5 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                              style={{ background: "linear-gradient(90deg, #159BEF 0%, #7B3FF2 100%)" }}
                            >
                              {order.status === "PAID" ? (
                                <>
                                  <Download size={13} /> Ver downloads
                                </>
                              ) : (
                                <>
                                  <CreditCard size={13} /> Ir para pagamento
                                </>
                              )}
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
