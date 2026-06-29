import Link from "next/link";
import { Prisma, type OrderStatus } from "@prisma/client";
import {
  CalendarDays,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Mail,
  Phone,
  Receipt,
  SearchX,
  User,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePhotographer } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";

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
        createdAt: true;
      };
    };
  };
}>;

type StatusSummary = {
  status: OrderStatus;
  _count: { status: number };
  _sum: { totalAmount: number | null };
};

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    className: string;
  }
> = {
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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${config.className}`}
    >
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
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-white">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${tone}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default async function OrdersAdminPage() {
  await requirePhotographer();

  const [orders, statusSummary, orphanPaymentLogs] = await Promise.all([
    prisma.order.findMany({
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
          take: 3,
          select: {
            id: true,
            eventType: true,
            externalId: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
      _sum: { totalAmount: true },
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

  const paidSummary = (statusSummary as StatusSummary[]).find(
    (item) => item.status === "PAID"
  );
  const paidRevenue = paidSummary?._sum.totalAmount ?? 0;
  const paidOrders = paidSummary?._count.status ?? 0;
  const totalPhotos = orders.reduce((acc, order) => acc + order.items.length, 0);

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
            Consulte todos os pagamentos da plataforma e veja as fotos vinculadas a cada compra.
          </p>
        </div>
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
          label="Pedidos totais"
          value={String(orders.length)}
          icon={FileText}
          tone="bg-sky-500/10 text-sky-300"
        />
        <SummaryCard
          label="Fotos vendidas"
          value={String(totalPhotos)}
          icon={ImageIcon}
          tone="bg-zinc-800 text-zinc-300"
        />
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-500">
            <SearchX size={26} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-white">Nenhum pagamento encontrado</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Assim que os compradores finalizarem pedidos, eles aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order: OrderWithDetails) => {
            const latestLog = order.paymentLogs[0];

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40"
              >
                <div className="grid gap-5 border-b border-zinc-800 p-5 xl:grid-cols-[1.35fr_0.85fr_0.8fr]">
                  <div className="min-w-0 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge status={order.status} />
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
