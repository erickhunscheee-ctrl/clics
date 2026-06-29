import Link from "next/link";
import { Prisma, type OrderStatus } from "@prisma/client";
import {
  AlertTriangle,
  CalendarDays,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Mail,
  Phone,
  QrCode,
  Receipt,
  Search,
  SearchX,
  ShoppingCart,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePhotographer } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";

type PaymentMethod = "PIX" | "CREDIT_CARD" | "UNKNOWN";
type PaymentMethodFilter = "all" | "pix" | "card" | "unknown";
type ConsultationFilter =
  | "all"
  | "pending"
  | "stale-pending"
  | "paid-today"
  | "failed"
  | "no-payment-id";

type OrdersPageSearchParams = {
  q?: string;
  status?: string;
  method?: string;
  consult?: string;
};

type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    album: {
      select: {
        id: true;
        title: true;
        slug: true;
        photographer: { select: { name: true; email: true } };
      };
    };
    items: {
      include: {
        photo: {
          select: {
            id: true;
            originalFileName: true;
            previewUrl: true;
            price: true;
            album: { select: { title: true; slug: true } };
            folder: { select: { name: true } };
          };
        };
      };
    };
    paymentLogs: {
      select: {
        id: true;
        eventType: true;
        externalId: true;
        payload: true;
        createdAt: true;
      };
    };
  };
}>;

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Pendente",
    className: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  },
  PAID: {
    label: "Pago",
    className: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  },
  FAILED: {
    label: "Falhou",
    className: "bg-red-500/10 text-red-300 border-red-500/20",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-zinc-700/40 text-zinc-300 border-zinc-600",
  },
  REFUNDED: {
    label: "Estornado",
    className: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  },
};

const methodConfig: Record<
  PaymentMethod,
  { label: string; className: string; icon: typeof CreditCard }
> = {
  PIX: {
    label: "Pix",
    className: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    icon: QrCode,
  },
  CREDIT_CARD: {
    label: "Cartao",
    className: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    icon: CreditCard,
  },
  UNKNOWN: {
    label: "Nao identificado",
    className: "bg-zinc-800 text-zinc-300 border-zinc-700",
    icon: FileText,
  },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function asRecord(value: Prisma.JsonValue): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readNestedString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function inferPaymentMethod(order: OrderWithDetails): PaymentMethod {
  for (const log of order.paymentLogs) {
    const eventType = log.eventType.toLowerCase();
    if (eventType.includes("pix")) return "PIX";
    if (eventType.includes("card") || eventType.includes("cartao")) return "CREDIT_CARD";

    const payload = asRecord(log.payload);
    if (!payload) continue;

    const directMethod = readNestedString(payload, "paymentMethod");
    if (directMethod === "PIX") return "PIX";
    if (directMethod === "CREDIT_CARD") return "CREDIT_CARD";

    const paymentResult = asRecord(payload.paymentResult as Prisma.JsonValue);
    const paymentDetails = asRecord(payload.paymentDetails as Prisma.JsonValue);
    const methodId =
      paymentResult?.paymentMethodId ||
      paymentDetails?.paymentMethodId ||
      paymentResult?.payment_method_id ||
      paymentDetails?.payment_method_id;
    const typeId =
      paymentResult?.paymentTypeId ||
      paymentDetails?.paymentTypeId ||
      paymentResult?.payment_type_id ||
      paymentDetails?.payment_type_id;

    if (methodId === "pix") return "PIX";
    if (typeId === "credit_card") return "CREDIT_CARD";
    if (typeof methodId === "string" && methodId) return "CREDIT_CARD";
  }

  return "UNKNOWN";
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${config.className}`}>
      {config.label}
    </span>
  );
}

function MethodBadge({ method }: { method: PaymentMethod }) {
  const config = methodConfig[method];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${config.className}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Receipt;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
          <p className="mt-2 text-2xl font-black text-white">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${tone}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
        active
          ? "border-violet-500/40 bg-violet-500/15 text-violet-200"
          : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

function buildQuery(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== "all") searchParams.set(key, value);
  });

  const query = searchParams.toString();
  return query ? `/dashboard/pedidos?${query}` : "/dashboard/pedidos";
}

function normalizeStatus(value?: string): OrderStatus | "all" {
  const statuses: OrderStatus[] = ["PENDING", "PAID", "FAILED", "CANCELLED", "REFUNDED"];
  return statuses.includes(value as OrderStatus) ? (value as OrderStatus) : "all";
}

function normalizeMethod(value?: string): PaymentMethodFilter {
  return value === "pix" || value === "card" || value === "unknown" ? value : "all";
}

function normalizeConsultation(value?: string): ConsultationFilter {
  const options: ConsultationFilter[] = [
    "all",
    "pending",
    "stale-pending",
    "paid-today",
    "failed",
    "no-payment-id",
  ];
  return options.includes(value as ConsultationFilter) ? (value as ConsultationFilter) : "all";
}

export default async function OrdersAdminPage({
  searchParams,
}: {
  searchParams: Promise<OrdersPageSearchParams>;
}) {
  await requirePhotographer();

  const filters = await searchParams;
  const query = filters.q?.trim() ?? "";
  const statusFilter = normalizeStatus(filters.status);
  const methodFilter = normalizeMethod(filters.method);
  const consultation = normalizeConsultation(filters.consult);
  const now = new Date();
  const staleCutoff = new Date(now.getTime() - 30 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const where: Prisma.OrderWhereInput = {};

  if (query) {
    where.OR = [
      { orderNumber: { contains: query, mode: "insensitive" } },
      { customerName: { contains: query, mode: "insensitive" } },
      { customerEmail: { contains: query, mode: "insensitive" } },
      { customerPhone: { contains: query, mode: "insensitive" } },
      { mercadoPagoPaymentId: { contains: query, mode: "insensitive" } },
      { album: { title: { contains: query, mode: "insensitive" } } },
      { items: { some: { photo: { originalFileName: { contains: query, mode: "insensitive" } } } } },
    ];
  }

  if (statusFilter !== "all") where.status = statusFilter;

  if (consultation === "pending") {
    where.status = "PENDING";
  } else if (consultation === "stale-pending") {
    where.status = "PENDING";
    where.createdAt = { lt: staleCutoff };
  } else if (consultation === "paid-today") {
    where.status = "PAID";
    where.updatedAt = { gte: todayStart };
  } else if (consultation === "failed") {
    where.status = { in: ["FAILED", "CANCELLED", "REFUNDED"] };
  } else if (consultation === "no-payment-id") {
    where.mercadoPagoPaymentId = null;
  }

  const [orders, allOrders, orphanPaymentLogs] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        album: {
          select: {
            id: true,
            title: true,
            slug: true,
            photographer: { select: { name: true, email: true } },
          },
        },
        items: {
          orderBy: { createdAt: "asc" },
          include: {
            photo: {
              select: {
                id: true,
                originalFileName: true,
                previewUrl: true,
                price: true,
                album: { select: { title: true, slug: true } },
                folder: { select: { name: true } },
              },
            },
          },
        },
        paymentLogs: {
          orderBy: { createdAt: "desc" },
          take: 4,
          select: {
            id: true,
            eventType: true,
            externalId: true,
            payload: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.order.findMany({
      include: {
        paymentLogs: {
          orderBy: { createdAt: "desc" },
          take: 4,
          select: {
            id: true,
            eventType: true,
            externalId: true,
            payload: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.paymentLog.findMany({
      where: { orderId: null },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        eventType: true,
        externalId: true,
        createdAt: true,
      },
    }),
  ]);

  const filteredOrders = orders.filter((order) => {
    const method = inferPaymentMethod(order);
    if (methodFilter === "pix") return method === "PIX";
    if (methodFilter === "card") return method === "CREDIT_CARD";
    if (methodFilter === "unknown") return method === "UNKNOWN";
    return true;
  });

  const paidRevenue = filteredOrders
    .filter((order) => order.status === "PAID")
    .reduce((acc, order) => acc + order.totalAmount, 0);
  const paidOrders = filteredOrders.filter((order) => order.status === "PAID").length;
  const pendingOrders = filteredOrders.filter((order) => order.status === "PENDING").length;
  const stalePendingOrders = filteredOrders.filter(
    (order) => order.status === "PENDING" && order.createdAt < staleCutoff
  ).length;
  const totalPhotos = filteredOrders.reduce((acc, order) => acc + order.items.length, 0);

  const allPending = allOrders.filter((order) => order.status === "PENDING").length;
  const pendingPix = allOrders.filter(
    (order) => order.status === "PENDING" && inferPaymentMethod(order as OrderWithDetails) === "PIX"
  ).length;
  const pendingCard = allOrders.filter(
    (order) => order.status === "PENDING" && inferPaymentMethod(order as OrderWithDetails) === "CREDIT_CARD"
  ).length;
  const failedPayments = allOrders.filter((order) =>
    ["FAILED", "CANCELLED", "REFUNDED"].includes(order.status)
  ).length;
  const noPaymentId = allOrders.filter((order) => !order.mercadoPagoPaymentId).length;

  const baseFilterValues = {
    q: query,
    status: statusFilter === "all" ? undefined : statusFilter,
    method: methodFilter === "all" ? undefined : methodFilter,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-400">
            Administrativo
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
            Pagamentos e pedidos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Consulte pagamentos por usuario, metodo, status e veja as fotos vinculadas a cada compra.
          </p>
        </div>
        <Link
          href="/dashboard/pedidos"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
        >
          Limpar filtros
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Faturamento pago"
          value={formatCurrency(paidRevenue)}
          icon={CreditCard}
          tone="bg-emerald-500/10 text-emerald-300"
        />
        <SummaryCard
          label="Pedidos pagos"
          value={String(paidOrders)}
          icon={Receipt}
          tone="bg-violet-500/10 text-violet-300"
        />
        <SummaryCard
          label="Pendentes"
          value={String(pendingOrders)}
          icon={ShoppingCart}
          tone="bg-amber-500/10 text-amber-300"
        />
        <SummaryCard
          label="Fotos no filtro"
          value={String(totalPhotos)}
          icon={ImageIcon}
          tone="bg-zinc-800 text-zinc-300"
        />
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <form className="grid flex-1 gap-3 md:grid-cols-[1.2fr_0.7fr_0.7fr_auto]" action="/dashboard/pedidos">
            <input type="hidden" name="consult" value={consultation === "all" ? "" : consultation} />
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                <Search size={13} />
                Usuario, pedido, foto ou pagamento
              </span>
              <input
                name="q"
                defaultValue={query}
                placeholder="Nome, e-mail, telefone, pedido, MP payment..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Status</span>
              <select
                name="status"
                defaultValue={statusFilter}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
              >
                <option value="all">Todos</option>
                <option value="PAID">Aprovado</option>
                <option value="PENDING">Pendente</option>
                <option value="FAILED">Falhou</option>
                <option value="CANCELLED">Cancelado</option>
                <option value="REFUNDED">Estornado</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Metodo</span>
              <select
                name="method"
                defaultValue={methodFilter}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
              >
                <option value="all">Todos</option>
                <option value="pix">Pix</option>
                <option value="card">Cartao</option>
                <option value="unknown">Nao identificado</option>
              </select>
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-500"
            >
              <SlidersHorizontal size={16} />
              Filtrar
            </button>
          </form>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <FilterLink
            href={buildQuery({ ...baseFilterValues, consult: undefined })}
            label="Todos"
            active={consultation === "all"}
          />
          <FilterLink
            href={buildQuery({ ...baseFilterValues, consult: "pending" })}
            label={`Pendentes (${allPending})`}
            active={consultation === "pending"}
          />
          <FilterLink
            href={buildQuery({ ...baseFilterValues, consult: "stale-pending" })}
            label={`Pendentes +30min (${stalePendingOrders})`}
            active={consultation === "stale-pending"}
          />
          <FilterLink
            href={buildQuery({ ...baseFilterValues, method: "pix", consult: "pending" })}
            label={`Pix pendente (${pendingPix})`}
            active={consultation === "pending" && methodFilter === "pix"}
          />
          <FilterLink
            href={buildQuery({ ...baseFilterValues, method: "card", consult: "pending" })}
            label={`Cartao pendente (${pendingCard})`}
            active={consultation === "pending" && methodFilter === "card"}
          />
          <FilterLink
            href={buildQuery({ ...baseFilterValues, consult: "paid-today" })}
            label="Aprovados hoje"
            active={consultation === "paid-today"}
          />
          <FilterLink
            href={buildQuery({ ...baseFilterValues, consult: "failed" })}
            label={`Falhas/estornos (${failedPayments})`}
            active={consultation === "failed"}
          />
          <FilterLink
            href={buildQuery({ ...baseFilterValues, consult: "no-payment-id" })}
            label={`Sem ID MP (${noPaymentId})`}
            active={consultation === "no-payment-id"}
          />
        </div>

        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 text-xs leading-relaxed text-zinc-400">
          Carrinhos antes de clicar em Pix/cartao ficam apenas no navegador do comprador. Aqui aparecem
          os carrinhos que chegaram ao checkout e viraram pedido/pagamento no banco.
        </div>
      </section>

      {stalePendingOrders > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>
            Existem {stalePendingOrders} pedido(s) pendente(s) ha mais de 30 minutos no filtro atual.
            Vale conferir se o comprador abandonou o Pix, se o webhook atrasou ou se houve recusa no gateway.
          </p>
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-500">
            <SearchX size={26} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-white">Nenhum resultado encontrado</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Ajuste os filtros para consultar outros pagamentos ou pedidos.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order) => {
            const latestLog = order.paymentLogs[0];
            const method = inferPaymentMethod(order);

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40"
              >
                <div className="grid gap-5 border-b border-zinc-800 p-5 xl:grid-cols-[1.35fr_0.85fr_0.8fr]">
                  <div className="min-w-0 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge status={order.status} />
                      <MethodBadge method={method} />
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Pedido #{order.orderNumber}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-white">{order.customerName}</h2>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Mail size={13} />
                          {order.customerEmail}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Phone size={13} />
                          {order.customerPhone || "Telefone nao informado"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={13} />
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-950/45 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Album e responsavel
                    </p>
                    <Link
                      href={`/dashboard/albuns/${order.album.id}`}
                      className="inline-flex max-w-full items-center gap-1.5 text-sm font-bold text-white hover:text-violet-300"
                    >
                      <span className="truncate">{order.album.title}</span>
                      <ExternalLink size={13} />
                    </Link>
                    <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <User size={12} />
                      {order.album.photographer.name} - {order.album.photographer.email}
                    </p>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-950/45 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Pagamento
                    </p>
                    <p className="text-2xl font-black text-emerald-300">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <div className="space-y-1 text-xs text-zinc-500">
                      <p className="truncate">
                        MP payment: {order.mercadoPagoPaymentId || "nao vinculado"}
                      </p>
                      <p className="truncate">
                        Ultimo log: {latestLog ? latestLog.eventType : "sem logs"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 p-5 xl:grid-cols-[1fr_18rem]">
                  <div className="min-w-0">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold text-white">
                        Fotos vinculadas ({order.items.length})
                      </h3>
                      <Link
                        href={`/pedido/${order.accessToken}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 hover:text-violet-200"
                      >
                        Ver pedido publico
                        <ExternalLink size={12} />
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex min-w-0 gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/45 p-3"
                        >
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.photo.previewUrl}
                              alt={item.photo.originalFileName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">
                              {item.photo.originalFileName}
                            </p>
                            <p className="mt-1 truncate text-xs text-zinc-500">
                              {item.photo.folder?.name || "Sem pasta"}
                            </p>
                            <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                              <span className="font-bold text-zinc-300">
                                {formatCurrency(item.price)}
                              </span>
                              <span className="inline-flex items-center gap-1 text-zinc-500">
                                <Download size={12} />
                                {item.downloadCount}x
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <aside className="rounded-2xl border border-zinc-800 bg-zinc-950/45 p-4">
                    <h3 className="text-sm font-bold text-white">Logs recentes</h3>
                    {order.paymentLogs.length === 0 ? (
                      <p className="mt-3 text-xs text-zinc-500">
                        Nenhum log de pagamento vinculado a este pedido.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {order.paymentLogs.map((log) => (
                          <div key={log.id} className="border-b border-zinc-900 pb-3 last:border-0 last:pb-0">
                            <p className="text-xs font-semibold text-zinc-300">{log.eventType}</p>
                            <p className="mt-1 truncate text-[11px] text-zinc-500">
                              {log.externalId || "sem ID externo"}
                            </p>
                            <p className="mt-1 text-[11px] text-zinc-600">{formatDate(log.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </aside>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {orphanPaymentLogs.length > 0 && (
        <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <h2 className="text-sm font-bold text-amber-200">
            Logs de pagamento sem pedido vinculado
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {orphanPaymentLogs.map((log) => (
              <div key={log.id} className="rounded-xl border border-amber-500/10 bg-zinc-950/35 p-3">
                <p className="truncate text-xs font-semibold text-zinc-200">{log.eventType}</p>
                <p className="mt-1 truncate text-[11px] text-zinc-500">
                  {log.externalId || "sem ID externo"}
                </p>
                <p className="mt-2 text-[11px] text-zinc-600">{formatDate(log.createdAt)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
