import Link from "next/link";
import Image from "next/image";
import { Prisma, type OrderStatus } from "@prisma/client";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Mail,
  Phone,
  QrCode,
  Receipt,
  Search,
  SearchX,
  SlidersHorizontal,
  User,
  FilterX,
  TrendingUp,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePhotographer } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";

// ??? Types ????????????????????????????????????????????????????????????????????

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

type OrderPhotoItem = OrderWithDetails["items"][number];

// ??? Config maps ??????????????????????????????????????????????????????????????

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Pendente",
    className: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  },
  PAID: {
    label: "Pago",
    className: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  },
  FAILED: {
    label: "Falhou",
    className: "bg-red-500/10 text-red-300 border-red-500/25",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-zinc-700/40 text-zinc-400 border-zinc-600/50",
  },
  REFUNDED: {
    label: "Estornado",
    className: "bg-sky-500/10 text-sky-300 border-sky-500/25",
  },
};

const methodConfig: Record<
  PaymentMethod,
  { label: string; className: string; icon: typeof CreditCard }
> = {
  PIX: {
    label: "Pix",
    className: "bg-teal-500/10 text-teal-300 border-teal-500/25",
    icon: QrCode,
  },
  CREDIT_CARD: {
    label: "Cartão",
    className: "bg-indigo-500/10 text-indigo-300 border-indigo-500/25",
    icon: CreditCard,
  },
  UNKNOWN: {
    label: "Não identificado",
    className: "bg-zinc-800/60 text-zinc-400 border-zinc-700/50",
    icon: FileText,
  },
};

// ??? Helpers ??????????????????????????????????????????????????????????????????

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

function buildQuery(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== "all") searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `/dashboard/pedidos?${query}` : "/dashboard/pedidos";
}

// ??? Sub-components ???????????????????????????????????????????????????????????

function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = statusConfig[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${className}`}>
      {label}
    </span>
  );
}

function MethodBadge({ method }: { method: PaymentMethod }) {
  const { label, className, icon: Icon } = methodConfig[method];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}>
      <Icon size={11} />
      {label}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Receipt;
  iconClass: string;
  accent?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 transition-colors ${
      accent
        ? "border-emerald-500/20 bg-emerald-500/5"
        : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05]"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
          <p className={`mt-2 text-2xl font-black tabular-nums ${accent ? "text-emerald-300" : "text-white"}`}>
            {value}
          </p>
          {sub && <p className="mt-1.5 text-[11px] text-zinc-500">{sub}</p>}
        </div>
        <div className={`flex-shrink-0 rounded-xl p-2.5 ${iconClass}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function SoldPhotoCard({ item }: { item: OrderPhotoItem }) {
  return (
    <a
      href={item.photo.previewUrl}
      target="_blank"
      rel="noreferrer"
      className="group grid min-w-0 grid-cols-[6rem_1fr] gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 transition hover:border-violet-500/30 hover:bg-violet-500/5 sm:grid-cols-[7rem_1fr] lg:grid-cols-1 lg:p-3"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-zinc-900 sm:aspect-[4/3] lg:aspect-[4/3]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.photo.previewUrl}
          alt={item.photo.originalFileName}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
          <Eye size={10} />
          Abrir
        </span>
      </div>
      <div className="min-w-0 self-center lg:self-auto">
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-zinc-200">
          {item.photo.originalFileName}
        </p>
        <p className="mt-1 truncate text-[11px] text-zinc-500">
          {item.photo.folder?.name || item.photo.album.title || "Sem pasta"}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="inline-flex items-center rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 font-bold text-emerald-300">
            {formatCurrency(item.price)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-medium text-zinc-400">
            <Download size={10} />
            {item.downloadCount}x
          </span>
        </div>
      </div>
    </a>
  );
}

function FilterChip({
  href,
  label,
  active,
  variant = "default",
}: {
  href: string;
  label: string;
  active: boolean;
  variant?: "default" | "warning" | "danger" | "success";
}) {
  const variants = {
    default: active
      ? "border-violet-500/40 bg-violet-500/15 text-violet-200"
      : "border-zinc-800 bg-transparent text-zinc-400 hover:border-zinc-700 hover:text-white",
    warning: active
      ? "border-amber-500/40 bg-amber-500/15 text-amber-200"
      : "border-zinc-800 bg-transparent text-zinc-400 hover:border-amber-500/30 hover:text-amber-300",
    danger: active
      ? "border-red-500/40 bg-red-500/15 text-red-200"
      : "border-zinc-800 bg-transparent text-zinc-400 hover:border-red-500/30 hover:text-red-300",
    success: active
      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
      : "border-zinc-800 bg-transparent text-zinc-400 hover:border-emerald-500/30 hover:text-emerald-300",
  };

  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${variants[variant]}`}
    >
      {label}
    </Link>
  );
}

// ??? Page ?????????????????????????????????????????????????????????????????????

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

  // ?? Build where clause ??
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

  const include = {
    album: {
      select: {
        id: true,
        title: true,
        slug: true,
        photographer: { select: { name: true, email: true } },
      },
    },
    items: {
      orderBy: { createdAt: "asc" as const },
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
      orderBy: { createdAt: "desc" as const },
      take: 4,
      select: {
        id: true,
        eventType: true,
        externalId: true,
        payload: true,
        createdAt: true,
      },
    },
  };

  const [orders, allOrders, orphanPaymentLogs] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, include }),
    prisma.order.findMany({
      include: {
        paymentLogs: {
          orderBy: { createdAt: "desc" },
          take: 4,
          select: { id: true, eventType: true, externalId: true, payload: true, createdAt: true },
        },
      },
    }),
    prisma.paymentLog.findMany({
      where: { orderId: null },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, eventType: true, externalId: true, createdAt: true },
    }),
  ]);

  // ?? Apply method filter (client-side since it's derived) ??
  const filteredOrders = orders.filter((order) => {
    const method = inferPaymentMethod(order);
    if (methodFilter === "pix") return method === "PIX";
    if (methodFilter === "card") return method === "CREDIT_CARD";
    if (methodFilter === "unknown") return method === "UNKNOWN";
    return true;
  });

  // ?? Metrics ??
  const paidOrders = filteredOrders.filter((o) => o.status === "PAID");
  const paidRevenue = paidOrders.reduce((acc, o) => acc + o.totalAmount, 0);
  const pendingOrders = filteredOrders.filter((o) => o.status === "PENDING");
  const stalePendingOrders = pendingOrders.filter((o) => o.createdAt < staleCutoff);
  const totalPhotos = filteredOrders.reduce((acc, o) => acc + o.items.length, 0);
  const soldPhotos = paidOrders.reduce((acc, o) => acc + o.items.length, 0);
  const ticketMedio = paidOrders.length > 0 ? paidRevenue / paidOrders.length : 0;

  // ?? Chip counters (global, ignoring current filter) ??
  const allPending = allOrders.filter((o) => o.status === "PENDING").length;
  const pendingPix = allOrders.filter(
    (o) => o.status === "PENDING" && inferPaymentMethod(o as OrderWithDetails) === "PIX"
  ).length;
  const pendingCard = allOrders.filter(
    (o) => o.status === "PENDING" && inferPaymentMethod(o as OrderWithDetails) === "CREDIT_CARD"
  ).length;
  const failedPayments = allOrders.filter((o) =>
    ["FAILED", "CANCELLED", "REFUNDED"].includes(o.status)
  ).length;
  const noPaymentId = allOrders.filter((o) => !o.mercadoPagoPaymentId).length;

  const baseFilterValues = {
    q: query,
    status: statusFilter === "all" ? undefined : statusFilter,
    method: methodFilter === "all" ? undefined : methodFilter,
  };

  const hasActiveFilters = query || statusFilter !== "all" || methodFilter !== "all" || consultation !== "all";

  return (
    <div className="space-y-6">

      {/* ?? Header ?? */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-12 w-28 items-center rounded-xl border border-white/10 bg-white/[0.06] px-3">
            <Image
              src="/logo_clics_branco.png"
              alt="CLICS"
              width={112}
              height={40}
              className="h-auto w-full object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
              Administrativo
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
              Pagamentos e fotos vendidas
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Consulte pagamentos por usuário, método e status.
            </p>
          </div>
        </div>
        {hasActiveFilters && (
          <Link
            href="/dashboard/pedidos"
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800 lg:self-auto"
          >
            <FilterX size={13} />
            Limpar filtros
          </Link>
        )}
      </div>

      {/* ?? KPI cards ?? */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          label="Faturamento pago"
          value={formatCurrency(paidRevenue)}
          sub={`ticket médio ${formatCurrency(ticketMedio)}`}
          icon={TrendingUp}
          iconClass="bg-emerald-500/10 text-emerald-400"
          accent
        />
        <SummaryCard
          label="Pedidos pagos"
          value={String(paidOrders.length)}
          sub={`de ${filteredOrders.length} no filtro`}
          icon={Receipt}
          iconClass="bg-violet-500/10 text-violet-400"
        />
        <SummaryCard
          label="Pendentes"
          value={String(pendingOrders.length)}
          sub={stalePendingOrders.length > 0 ? `${stalePendingOrders.length} há +30 min` : "todos recentes"}
          icon={Clock}
          iconClass="bg-amber-500/10 text-amber-400"
        />
        <SummaryCard
          label="Fotos vendidas"
          value={String(soldPhotos)}
          sub={`${totalPhotos} vinculadas`}
          icon={ImageIcon}
          iconClass="bg-zinc-700/60 text-zinc-400"
        />
      </div>

      {/* ?? Filters ?? */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <div className="p-4 sm:p-5">
          <form
            className="grid gap-3 md:grid-cols-[1fr_0.55fr_0.55fr_auto]"
            action="/dashboard/pedidos"
          >
            <input type="hidden" name="consult" value={consultation === "all" ? "" : consultation} />

            {/* Search */}
            <label className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                <Search size={11} />
                Busca
              </span>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Nome, e-mail, pedido, MP payment ID..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 py-2.5 pl-8 pr-3 text-xs text-white placeholder:text-zinc-600 outline-none transition focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20"
                />
              </div>
            </label>

            {/* Status */}
            <label className="space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Status</span>
              <select
                name="status"
                defaultValue={statusFilter}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 py-2.5 px-3 text-xs text-white outline-none transition focus:border-violet-500/60 appearance-none cursor-pointer"
              >
                <option value="all">Todos</option>
                <option value="PAID">Aprovado</option>
                <option value="PENDING">Pendente</option>
                <option value="FAILED">Falhou</option>
                <option value="CANCELLED">Cancelado</option>
                <option value="REFUNDED">Estornado</option>
              </select>
            </label>

            {/* Method */}
            <label className="space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Método</span>
              <select
                name="method"
                defaultValue={methodFilter}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 py-2.5 px-3 text-xs text-white outline-none transition focus:border-violet-500/60 appearance-none cursor-pointer"
              >
                <option value="all">Todos</option>
                <option value="pix">Pix</option>
                <option value="card">Cartão</option>
                <option value="unknown">Não identificado</option>
              </select>
            </label>

            <button
              type="submit"
              className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-500 active:scale-95"
            >
              <SlidersHorizontal size={13} />
              Filtrar
            </button>
          </form>

          {/* Quick filter chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            <FilterChip
              href={buildQuery({ ...baseFilterValues, consult: undefined })}
              label={`Todos (${allOrders.length})`}
              active={consultation === "all"}
            />
            <FilterChip
              href={buildQuery({ ...baseFilterValues, consult: "pending" })}
              label={`Pendentes (${allPending})`}
              active={consultation === "pending"}
              variant="warning"
            />
            <FilterChip
              href={buildQuery({ ...baseFilterValues, consult: "stale-pending" })}
              label={`+30 min (${stalePendingOrders.length})`}
              active={consultation === "stale-pending"}
              variant="warning"
            />
            <FilterChip
              href={buildQuery({ ...baseFilterValues, method: "pix", consult: "pending" })}
              label={`Pix pendente (${pendingPix})`}
              active={consultation === "pending" && methodFilter === "pix"}
              variant="warning"
            />
            <FilterChip
              href={buildQuery({ ...baseFilterValues, method: "card", consult: "pending" })}
              label={`Cartão pendente (${pendingCard})`}
              active={consultation === "pending" && methodFilter === "card"}
              variant="warning"
            />
            <FilterChip
              href={buildQuery({ ...baseFilterValues, consult: "paid-today" })}
              label="Aprovados hoje"
              active={consultation === "paid-today"}
              variant="success"
            />
            <FilterChip
              href={buildQuery({ ...baseFilterValues, consult: "failed" })}
              label={`Falhas / estornos (${failedPayments})`}
              active={consultation === "failed"}
              variant="danger"
            />
            <FilterChip
              href={buildQuery({ ...baseFilterValues, consult: "no-payment-id" })}
              label={`Sem ID MP (${noPaymentId})`}
              active={consultation === "no-payment-id"}
            />
          </div>

          {/* Result summary */}
          <p className="mt-4 border-t border-zinc-800/60 pt-4 text-[11px] leading-relaxed text-zinc-500">
            Este filtro encontrou{" "}
            <span className="font-semibold text-zinc-300">{filteredOrders.length} pedido(s)</span>,{" "}
            <span className="font-semibold text-zinc-300">{totalPhotos} foto(s) vinculada(s)</span> e{" "}
            <span className="font-semibold text-zinc-300">{soldPhotos} foto(s) vendida(s)</span> em pagamentos aprovados.
            Carrinhos antes de clicar em Pix/cartão ficam apenas no navegador do comprador; aqui aparecem os que chegaram ao checkout.
          </p>
        </div>
      </section>

      {/* ?? Stale pending alert ?? */}
      {stalePendingOrders.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3.5 text-xs text-amber-100/90">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-400" />
          <p>
            <span className="font-bold">
              {stalePendingOrders.length} pedido(s) pendente(s) há mais de 30 minutos
            </span>{" "}
            no filtro atual. Vale conferir se o comprador abandonou o Pix, se o webhook atrasou ou se houve recusa no gateway.
          </p>
        </div>
      )}

      {/* ?? Orders list ?? */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/60 bg-zinc-900/20 px-6 py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/60 text-zinc-500">
            <SearchX size={22} />
          </div>
          <h2 className="mt-4 text-sm font-bold text-white">Nenhum resultado encontrado</h2>
          <p className="mt-1.5 max-w-xs text-xs text-zinc-500">
            Ajuste os filtros para consultar outros pagamentos ou pedidos.
          </p>
          <Link
            href="/dashboard/pedidos"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-700"
          >
            <FilterX size={12} />
            Limpar filtros
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const latestLog = order.paymentLogs[0];
            const method = inferPaymentMethod(order);

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-white/[0.09] bg-zinc-950/60"
              >
                {/* Card header */}
                <div className="border-b border-white/[0.07] bg-white/[0.03] px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={order.status} />
                    <MethodBadge method={method} />
                    <span className="font-mono text-[10px] text-zinc-600">
                      #{order.orderNumber}
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-zinc-400">
                      <ImageIcon size={11} />
                      {order.items.length} foto(s)
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600">
                      <CalendarDays size={11} />
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="grid gap-px bg-white/[0.06] xl:grid-cols-[1.4fr_0.85fr_0.85fr]">

                  {/* Col 1 ? buyer */}
                  <div className="bg-zinc-950/70 p-4 sm:p-5">
                    <h2 className="text-base font-bold text-white">{order.customerName}</h2>
                    <div className="mt-3 grid gap-1.5 text-[11px] sm:grid-cols-2">
                      <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-zinc-400">
                        <Mail size={11} className="shrink-0 text-zinc-600" />
                        <span className="truncate">{order.customerEmail}</span>
                      </span>
                      <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-zinc-400">
                        <Phone size={11} className="shrink-0 text-zinc-600" />
                        <span className="truncate">{order.customerPhone || "Não informado"}</span>
                      </span>
                    </div>
                  </div>

                  {/* Col 2 ? album */}
                  <div className="bg-zinc-950/70 p-4 sm:p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                      Álbum e responsável
                    </p>
                    <Link
                      href={`/dashboard/albuns/${order.album.id}`}
                      className="mt-2 inline-flex max-w-full items-center gap-1 text-sm font-semibold text-white transition hover:text-violet-300"
                    >
                      <span className="truncate">{order.album.title}</span>
                      <ExternalLink size={11} className="shrink-0 opacity-60" />
                    </Link>
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500">
                      <User size={11} />
                      <span className="truncate">
                        {order.album.photographer.name} · {order.album.photographer.email}
                      </span>
                    </p>
                  </div>

                  {/* Col 3 ? payment */}
                  <div className="bg-zinc-950/70 p-4 sm:p-5">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                      <CheckCircle2 size={11} />
                      Pagamento
                    </p>
                    <p className="mt-2 text-xl font-black tabular-nums text-emerald-300">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <div className="mt-2.5 space-y-1 text-[10px] text-zinc-600">
                      <p className="truncate font-mono">
                        MP: {order.mercadoPagoPaymentId || "não vinculado"}
                      </p>
                      <p className={`truncate font-medium ${
                        latestLog?.eventType?.includes("APPROVED") ? "text-emerald-500" :
                        latestLog?.eventType?.includes("PENDING") ? "text-amber-500" :
                        latestLog?.eventType?.includes("FAILED") ? "text-red-500" :
                        "text-zinc-600"
                      }`}>
                        {latestLog ? latestLog.eventType : "sem logs"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Photos + logs */}
                <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[1fr_17rem]">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {order.status === "PAID" ? "Fotos vendidas" : "Fotos no pedido"}{" "}
                          <span className="font-normal text-zinc-500">({order.items.length})</span>
                        </h3>
                        <p className="mt-0.5 text-[11px] text-zinc-600">
                          Toque na foto para abrir a prévia em tamanho maior.
                        </p>
                      </div>
                      <Link
                        href={`/pedido/${order.accessToken}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-violet-400 transition hover:text-violet-300 hover:border-violet-500/30"
                      >
                        Ver pedido público
                        <ExternalLink size={11} />
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 2xl:grid-cols-3">
                      {order.items.map((item) => (
                        <SoldPhotoCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>

                  {/* Payment logs sidebar */}
                  <aside className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                    <h3 className="text-xs font-semibold text-zinc-400">Logs recentes</h3>
                    {order.paymentLogs.length === 0 ? (
                      <p className="mt-3 text-[11px] text-zinc-600">
                        Nenhum log vinculado a este pedido.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {order.paymentLogs.map((log) => (
                          <div
                            key={log.id}
                            className="border-b border-zinc-900 pb-2.5 last:border-0 last:pb-0"
                          >
                            <p className={`text-[11px] font-semibold ${
                              log.eventType?.includes("APPROVED") ? "text-emerald-400" :
                              log.eventType?.includes("PENDING") ? "text-amber-400" :
                              log.eventType?.includes("FAILED") ? "text-red-400" :
                              "text-zinc-300"
                            }`}>
                              {log.eventType}
                            </p>
                            <p className="mt-0.5 truncate font-mono text-[10px] text-zinc-600">
                              {log.externalId || "sem ID externo"}
                            </p>
                            <p className="mt-0.5 text-[10px] text-zinc-700">
                              {formatDate(log.createdAt)}
                            </p>
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

      {/* ?? Orphan payment logs ?? */}
      {orphanPaymentLogs.length > 0 && (
        <section className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.04] p-5">
          <h2 className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <AlertTriangle size={13} />
            Logs de pagamento sem pedido vinculado ({orphanPaymentLogs.length})
          </h2>
          <p className="mt-1 text-[11px] text-zinc-500">
            Esses logs chegaram via webhook mas não foram associados a nenhum pedido. Pode ser uma condição de corrida ou pagamento fora do fluxo normal.
          </p>
          <div className="mt-4 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            {orphanPaymentLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-amber-500/10 bg-zinc-950/50 p-3"
              >
                <p className="truncate text-[11px] font-semibold text-zinc-300">{log.eventType}</p>
                <p className="mt-1 truncate font-mono text-[10px] text-zinc-600">
                  {log.externalId || "sem ID externo"}
                </p>
                <p className="mt-2 text-[10px] text-zinc-700">{formatDate(log.createdAt)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
