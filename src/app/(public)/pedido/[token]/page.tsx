import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/money";
import { getPaymentDetails, mapPaymentStatus } from "@/lib/mercadopago";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  CreditCard,
  ShoppingBag,
  Phone,
  Mail,
  User,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface OrderPageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ status?: string; payment_id?: string; collection_id?: string }>;
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const { token } = await params;
  const { payment_id: paymentId, collection_id: collectionId } = await searchParams;

  let order = await prisma.order.findUnique({
    where: { accessToken: token },
    include: {
      album: { select: { title: true, coverImageUrl: true } },
      items: {
        include: {
          photo: {
            select: { id: true, originalFileName: true, previewUrl: true, price: true },
          },
        },
      },
    },
  });

  if (!order) notFound();

  const returnedPaymentId = paymentId || collectionId;
  if (returnedPaymentId && order.status === "PENDING") {
    try {
      const paymentDetails = await getPaymentDetails(returnedPaymentId);
      if (paymentDetails.externalReference === order.id) {
        const nextStatus = mapPaymentStatus(paymentDetails.status || "");
        order = await prisma.order.update({
          where: { id: order.id },
          data: { status: nextStatus, mercadoPagoPaymentId: returnedPaymentId },
          include: {
            album: { select: { title: true, coverImageUrl: true } },
            items: {
              include: {
                photo: {
                  select: { id: true, originalFileName: true, previewUrl: true, price: true },
                },
              },
            },
          },
        });
      }
    } catch (error) {
      console.error("Erro ao sincronizar pagamento:", error);
    }
  }

  const isExpired = new Date() > order.accessTokenExpiresAt;

  // Config por status
  const statusConfig = {
    PAID: {
      icon: CheckCircle2,
      label: "Pagamento Aprovado!",
      description: "Seus downloads já estão liberados abaixo. Aproveite!",
      iconBg: "rgba(21,155,239,0.1)",
      iconColor: "#159BEF",
      badgeBg: "rgba(21,155,239,0.08)",
      badgeColor: "#159BEF",
      badgeBorder: "rgba(21,155,239,0.2)",
      badgeLabel: "Pago",
    },
    PENDING: {
      icon: Clock,
      label: "Aguardando Pagamento",
      description: "Assim que o Mercado Pago confirmar a transação, seus downloads serão liberados.",
      iconBg: "rgba(234,179,8,0.1)",
      iconColor: "#d97706",
      badgeBg: "rgba(234,179,8,0.08)",
      badgeColor: "#d97706",
      badgeBorder: "rgba(234,179,8,0.2)",
      badgeLabel: "Pendente",
    },
    FAILED: {
      icon: XCircle,
      label: "Pagamento não Confirmado",
      description: "Houve um problema com a transação. Por favor, entre em contato ou tente novamente.",
      iconBg: "rgba(239,68,68,0.1)",
      iconColor: "#dc2626",
      badgeBg: "rgba(239,68,68,0.08)",
      badgeColor: "#dc2626",
      badgeBorder: "rgba(239,68,68,0.2)",
      badgeLabel: "Falhou",
    },
    CANCELLED: {
      icon: XCircle,
      label: "Pedido Cancelado",
      description: "Este pedido foi cancelado. Entre em contato com suporte se necessário.",
      iconBg: "rgba(239,68,68,0.1)",
      iconColor: "#dc2626",
      badgeBg: "rgba(239,68,68,0.08)",
      badgeColor: "#dc2626",
      badgeBorder: "rgba(239,68,68,0.2)",
      badgeLabel: "Cancelado",
    },
    REFUNDED: {
      icon: XCircle,
      label: "Pagamento Estornado",
      description: "O valor foi estornado para sua conta.",
      iconBg: "rgba(239,68,68,0.1)",
      iconColor: "#dc2626",
      badgeBg: "rgba(239,68,68,0.08)",
      badgeColor: "#dc2626",
      badgeBorder: "rgba(239,68,68,0.2)",
      badgeLabel: "Estornado",
    },
  };

  const cfg = statusConfig[order.status as keyof typeof statusConfig] ?? statusConfig.PENDING;
  const StatusIcon = cfg.icon;

  return (
    <div
      className="min-h-screen pb-12"
      style={{ background: "#F6F8FC", color: "#061337", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
    >
      {/* ── Header ─────────────────────────── */}
      <header className="sticky top-0 z-40 px-4 pt-4 pb-2" style={{ background: "#F6F8FC" }}>
        <div
          className="flex items-center gap-3 bg-white rounded-2xl px-5 py-3.5 max-w-4xl mx-auto"
          style={{ boxShadow: "0 2px 16px rgba(6,19,55,0.07)" }}
        >
          <Link
            href="/"
            className="p-2 rounded-xl transition-colors hover:bg-[#F6F8FC]"
            aria-label="Voltar ao início"
            style={{ color: "#061337" }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="h-4 w-px mx-1" style={{ background: "#e5e7eb" }} />
          <Link href="/">
            <Image src="/logo_clics.png" alt="CLICS" width={30} height={30} className="w-8 h-8 object-contain" />
          </Link>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9ca3af" }}>
              Pedido #{order.orderNumber}
            </p>
          </div>
          {/* Badge status */}
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{
              background: cfg.badgeBg,
              color: cfg.badgeColor,
              border: `1px solid ${cfg.badgeBorder}`,
            }}
          >
            {cfg.badgeLabel}
          </span>
        </div>
      </header>

      {/* ── Conteúdo ───────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-5">

        {/* ── Status Card ── */}
        <div className="bg-white rounded-3xl p-6 md:p-8" style={{ boxShadow: "0 2px 16px rgba(6,19,55,0.07)" }}>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: cfg.iconBg }}
            >
              <StatusIcon size={32} style={{ color: cfg.iconColor }} className={order.status === "PENDING" ? "animate-pulse" : ""} />
            </div>
            <div className="text-center sm:text-left">
              <h1
                className="text-xl md:text-2xl font-bold"
                style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)", color: "#061337" }}
              >
                {cfg.label}
              </h1>
              <p className="mt-1 text-sm" style={{ color: "#6b7280" }}>{cfg.description}</p>
            </div>
          </div>

          {/* Token expirado */}
          {isExpired && order.status === "PAID" && (
            <div
              className="mt-5 p-4 rounded-2xl text-sm"
              style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)", color: "#d97706" }}
            >
              ⚠ O link de acesso expirou. O prazo para downloads é de 30 dias após a compra.
            </div>
          )}
        </div>

        {/* ── Grid de conteúdo ── */}
        <div className="grid md:grid-cols-3 gap-5">

          {/* ── Fotos / Downloads ── */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-3xl p-6 space-y-5" style={{ boxShadow: "0 2px 16px rgba(6,19,55,0.07)" }}>
              <h2
                className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 pb-3"
                style={{
                  fontFamily: "var(--font-poppins, Poppins, sans-serif)",
                  color: "#9ca3af",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <ShoppingBag size={14} style={{ color: "#159BEF" }} />
                Fotos do Pedido ({order.items.length})
              </h2>

              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4"
                    style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: "12px" }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-14 w-14 rounded-xl overflow-hidden flex-shrink-0"
                        style={{ border: "1px solid #e5e7eb" }}
                      >
                        <img
                          src={item.photo.previewUrl}
                          alt={item.photo.originalFileName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate max-w-[180px] sm:max-w-xs" style={{ color: "#061337" }}>
                          {item.photo.originalFileName}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
                          {formatCurrency(item.price)}
                        </p>
                        {item.downloadCount > 0 && (
                          <span className="text-[10px]" style={{ color: "#9ca3af" }}>
                            Baixada {item.downloadCount}x
                          </span>
                        )}
                      </div>
                    </div>

                    {order.status === "PAID" && !isExpired && (
                      <a
                        href={`/api/download/${item.photoId}?token=${token}`}
                        className="flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:-translate-y-0.5 flex-shrink-0"
                        style={{
                          background: "linear-gradient(135deg, #159BEF, #7B3FF2)",
                          boxShadow: "0 4px 12px rgba(21,155,239,0.3)",
                          color: "white",
                        }}
                        title="Baixar foto original"
                        download
                      >
                        <Download size={16} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-5">

            {/* Resumo financeiro */}
            <div className="bg-white rounded-3xl p-6 space-y-4" style={{ boxShadow: "0 2px 16px rgba(6,19,55,0.07)" }}>
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-3"
                style={{
                  fontFamily: "var(--font-poppins, Poppins, sans-serif)",
                  color: "#9ca3af",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Resumo do Pedido
              </h2>

              {/* Comprador */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9ca3af" }}>Comprador</p>
                <div className="space-y-1.5 text-xs" style={{ color: "#6b7280" }}>
                  <div className="flex items-center gap-2">
                    <User size={12} style={{ color: "#159BEF" }} />
                    <span>{order.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={12} style={{ color: "#159BEF" }} />
                    <span className="truncate">{order.customerEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={12} style={{ color: "#159BEF" }} />
                    <span>{order.customerPhone}</span>
                  </div>
                </div>
              </div>

              {/* Valores */}
              <div className="space-y-2 pt-3" style={{ borderTop: "1px solid #e5e7eb" }}>
                <div className="flex justify-between text-xs" style={{ color: "#6b7280" }}>
                  <span>Fotos ({order.items.length})</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center pt-2" style={{ borderTop: "1px solid #e5e7eb" }}>
                  <span className="font-bold text-sm" style={{ color: "#061337" }}>Total</span>
                  <span
                    className="font-black text-lg"
                    style={{
                      fontFamily: "var(--font-poppins, Poppins, sans-serif)",
                      background: "linear-gradient(90deg, #159BEF, #7B3FF2)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Link para a galeria */}
            <Link
              href={`/album/${order.album?.title ? "#" : "/"}`}
              className="block w-full text-center py-3 rounded-2xl text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{
                background: "white",
                color: "#061337",
                border: "1px solid #e5e7eb",
                boxShadow: "0 2px 8px rgba(6,19,55,0.06)",
              }}
            >
              ← Voltar ao início
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
